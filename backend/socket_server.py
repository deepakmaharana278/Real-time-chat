import eventlet
eventlet.monkey_patch()

import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE","real_time_chat.settings")
django.setup()

import socketio
from chat_app.models import Message
from django.db import close_old_connections, connection
from contextlib import contextmanager
from datetime import datetime


# DB helper — call this wrapping every block of ORM code
@contextmanager
def db_session():
    """
    Ensures a fresh DB connection for this green thread and
    always releases it when done — even if an exception is raised.
    """
    close_old_connections()
    try:
        yield
    finally:
        connection.close()  # critical: prevents connection leak across green threads


# Create Socket.IO server
sio = socketio.Server(
    cors_allowed_origins="*",
    async_mode="eventlet"
)
# Create WSGI app
app = socketio.WSGIApp(sio)

users = {}

@sio.event
def connect(sid, environ):
    print("User connected:", sid)

    
@sio.event
def join_chat(sid, data):
    username = data["username"]
    users[sid] = username
    print(username, "joined chat")

    with db_session():
        messages = Message.objects.all().order_by("timestamp")[:50]
        history = [
            {
                "id":msg.id,           
                "username":msg.sender,
                "message":msg.message,
                "private":msg.receiver is not None,
                "audio":msg.audio,
                "msg_type":msg.msg_type,
                "status":msg.status,      
                "time":msg.timestamp.strftime("%H:%M"),
            }
            for msg in messages
        ]

    sio.emit("chat_history", history, to=sid)
    sio.emit("receive_message", {
        "system":  True,
        "message": f"{username} joined the chat",
    })
    sio.emit("users_list", list(users.values()))


@sio.event
def send_message(sid, data):
    sender = users.get(sid)
    message = data.get("message")
    target_user = data.get("target")


    target_sid = next(
        (s for s, name in users.items() if name == target_user), None
    ) if target_user else None

    initial_status = "delivered" if target_sid else "sent"

    with db_session():
        msg_obj = Message.objects.create(
            sender=sender,
            receiver=target_user,
            message=message,
            status=initial_status,
        )
        msg_id = msg_obj.id

    payload = {
        "id":       msg_id,
        "username": sender,
        "message":  message,
        "private":  bool(target_user),
        "status":   initial_status,      
        "time":     datetime.now().strftime("%H:%M"),
    }

    if target_user:
        if target_sid:
            sio.emit("receive_message", payload, to=target_sid)
        sio.emit("receive_message", payload, to=sid)

        if target_sid:
            sio.emit("message_status", {"id": msg_id, "status": "delivered"}, to=sid)
    else:
        sio.emit("receive_message", payload)



@sio.event
def messages_read(sid, data):
    reader = users.get(sid)
    sender_name = data.get("from_user")

    with db_session():
        updated_ids = list(
            Message.objects.filter(
                sender=sender_name,
                receiver=reader,
            ).exclude(status="read")
            .values_list("id", flat=True)
        )
        if updated_ids:                    
            Message.objects.filter(id__in=updated_ids).update(status="read")

    # Notify the original sender their messages were read
    sender_sid = next(
        (s for s, name in users.items() if name == sender_name), None
    )
    if sender_sid and updated_ids:
        sio.emit("message_status", {
            "ids":    updated_ids,
            "status": "read"
        }, to=sender_sid)
        

@sio.event
def typing(sid, data):
    username = users.get(sid)
    target_user = data.get("target")

    # privatae typing
    if target_user:
        target_sid = next(
            (s for s, name in users.items() if name == target_user),
            None
        )

        if target_sid:
            sio.emit("typing", {"username": username}, to=target_sid)
    # Public typing
    else:
        sio.emit(
            "typing",
            {"username": username},
            skip_sid=sid   
        )

@sio.event
def send_voice(sid, data):
    sender = users.get(sid)
    audio_base64 = data.get("audio")   # base64 string
    target_user = data.get("target")

    target_sid = next(
        (s for s, name in users.items() if name == target_user), None
    ) if target_user else None

    initial_status = "delivered" if target_sid else "sent"

    with db_session():
        msg_obj = Message.objects.create(
            sender=sender,
            receiver=target_user,
            audio=audio_base64,
            msg_type="audio",
            status=initial_status,
        )
        msg_id = msg_obj.id

    payload = {
        "id":msg_id,
        "username": sender,
        "audio":audio_base64,
        "msg_type":"audio",
        "private":bool(target_user),
        "status":initial_status,
        "time":datetime.now().strftime("%H:%M"),
    }

    if target_user:
        if target_sid:
            sio.emit("receive_message", payload, to=target_sid)
            sio.emit("message_status", {"id": msg_id, "status": "delivered"}, to=sid)
        sio.emit("receive_message", payload, to=sid)
    else:
        sio.emit("receive_message", payload)


@sio.event
def disconnect(sid):
    username = users.pop(sid, None)
    if username:
        print(username, "disconnected")
        sio.emit("receive_message", {
            "system":  True,
            "message": f"{username} left the chat",
        })
        sio.emit("users_list", list(users.values()))


 
# Entry point
if __name__ == "__main__":
    print("Socket.IO server running on port 5000")
    eventlet.wsgi.server(
        eventlet.listen(("0.0.0.0", 5000)),
        app
    )