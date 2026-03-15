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
        messages = Message.objects.order_by("timestamp")[:50]
        history = [
            {
                "username": msg.sender,
                "message":  msg.message,
                "private":  msg.receiver is not None,
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
    target_user = data.get("target")  # None for public messages

    with db_session():
        Message.objects.create(
            sender=sender,
            receiver=target_user,
            message=message,
        )

    if target_user:
        # resolve target's sid
        target_sid = next(
            (s for s, name in users.items() if name == target_user),
            None
        )
        payload = {
            "username": sender, 
            "message": message, 
            "private": True,
            "time": datetime.now().strftime("%H:%M")
        }
        if target_sid:
            sio.emit("receive_message", payload, to=target_sid)
        sio.emit("receive_message", payload, to=sid)   
    else:
        sio.emit("receive_message", {
            "username": sender, 
            "message": message,
            "time": datetime.now().strftime("%H:%M")
        })


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