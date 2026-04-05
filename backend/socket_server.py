import eventlet
eventlet.monkey_patch()

import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE","real_time_chat.settings")
django.setup()

import socketio
from chat_app.models import *
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
                "file":msg.file,
                "file_name":msg.file_name,
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
        "id": msg_id,
        "username": sender,
        "message": message,
        "private": bool(target_user),
        "status": initial_status,      
        "time": datetime.now().strftime("%H:%M"),
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
def add_reaction(sid, data):
    username = users.get(sid)
    if not username:
        return
    
    message_id = data.get("message_id")
    emoji = data.get("emoji")
    
    with db_session():
        try:
            message = Message.objects.get(id=message_id)
            
            # Check if user already reacted with this emoji
            existing_reaction = MessageReaction.objects.filter(
                message=message,
                user=username,
                emoji=emoji
            ).first()
            
            if existing_reaction:
                # Remove reaction
                existing_reaction.delete()
                action = "removed"
            else:
                # Add new reaction
                MessageReaction.objects.create(
                    message=message,
                    user=username,
                    emoji=emoji
                )
                action = "added"
            
            # Get all reactions for this message
            reactions = {}
            for reaction in message.reaction_set.all():
                if reaction.emoji not in reactions:
                    reactions[reaction.emoji] = []
                reactions[reaction.emoji].append(reaction.user)
            
            # Notify all participants
            sio.emit("reaction_updated", {
                "message_id": message_id,
                "reactions": reactions,
                "user": username,
                "emoji": emoji,
                "action": action
            })
            
        except Message.DoesNotExist:
            pass

@sio.event
def edit_message(sid, data):
    username = users.get(sid)
    if not username:
        return
    
    message_id = data.get("message_id")
    new_message = data.get("new_message")
    
    with db_session():
        try:
            message = Message.objects.get(id=message_id)
            
            # Check if user is the sender
            if message.sender != username:
                sio.emit("error", {"message": "You can only edit your own messages"}, to=sid)
                return
            
            # Update message
            message.message = new_message
            message.is_edited = True
            message.save()
            
            # Notify all participants
            sio.emit("message_edited", {
                "message_id": message_id,
                "new_message": new_message,
                "edited_at": datetime.now().strftime("%H:%M"),
                "username": username
            })
            
        except Message.DoesNotExist:
            pass

@sio.event
def delete_message(sid, data):
    username = users.get(sid)
    if not username:
        return
    
    message_id = data.get("message_id")
    delete_for_everyone = data.get("delete_for_everyone", True)
    
    with db_session():
        try:
            message = Message.objects.get(id=message_id)
            
            # Check if user is the sender
            if message.sender != username:
                sio.emit("error", {"message": "You can only delete your own messages"}, to=sid)
                return
            
            if delete_for_everyone:
                # Soft delete for everyone
                message.is_deleted = True
                message.message = "This message was deleted"
                message.save()
                
                sio.emit("message_deleted", {
                    "message_id": message_id,
                    "deleted_by": username,
                    "deleted_at": datetime.now().strftime("%H:%M")
                })
            else:
                # Delete just for the current user (store in a separate table)
                # You might want to create a UserMessageStatus model for this
                pass
            
        except Message.DoesNotExist:
            pass


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
def send_file(sid, data):
    sender = users.get(sid)

    file_url = data.get("file_url")
    file_name = data.get("file_name")
    target_user = data.get("target")

    target_sid = next(
        (s for s, name in users.items() if name == target_user), None
    ) if target_user else None

    initial_status = "delivered" if target_sid else "sent"

    with db_session():
        msg = Message.objects.create(
            sender=sender,
            receiver=target_user,
            file_name=file_name,
            msg_type="file",
            status=initial_status
        )
        msg_id = msg.id

    payload = {
        "id": msg_id,
        "username": sender,
        "file_url": file_url,
        "file_name": file_name,
        "msg_type": "file",
        "private": bool(target_user),
        "status": initial_status,
        "time": datetime.now().strftime("%H:%M"),
    }

    if target_user:
        if target_sid:
            sio.emit("receive_message",payload,to=target_sid)
            sio.emit("message_status",{"id": msg_id, "status": "delivered"},to=sid)

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
        eventlet.listen(("0.0.0.0", 5001)),
        app
    )