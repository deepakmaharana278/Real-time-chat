import eventlet
eventlet.monkey_patch()

import socketio

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

    print("Join event recevied:", data)

    username = data["username"]

    users[sid] = username

    print(username, "joined chat")

    sio.emit("receive_message", {
        "system": True,
        "message": f"{username} joined the chat"
    })

    sio.emit("users_list", list(users.values()))


@sio.event
def send_message(sid, data):
    # print("Message:", data)

    sender = users.get(sid)
    message = data["message"]
    target_user = data.get("target")  # private receiver
    
    # Private Message
    if target_user:

        target_sid = None

        for s, name in users.items():
            if name == target_user:
                target_sid = s
                break

        if target_sid:
            # send to receiver
            sio.emit("receive_message", {
                "username": sender,
                "message": data["message"],
                "private":True
            },to=target_sid)

            # send to sender
            sio.emit("receive_message", {
                "username": sender,
                "message": message,
                "private": True
            }, to=sid)
    else:
        # Public message
        sio.emit("receive_message", {
            "username": sender,
            "message": message
        })
    


@sio.event
def disconnect(sid):

    username = users.get(sid)

    if username:
        print(username,"User disconnected:")

        sio.emit("receive_message",{
            "system": True,
            "message": f"{username} left the chat"
        })

        del users[sid]

        sio.emit("users_list", list(users.values()))


if __name__ == "__main__":
    print("Socket.IO server running on port 5000")

    eventlet.wsgi.server(
        eventlet.listen(("0.0.0.0", 5000)),
        app
    )