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


def join_chat(sid,data):
    username = data["username"]

    users[sid] = username
    print(username,"joined chat")

    sio.emit("receive_message", {
        "system": True,
        "message":f"{username} joined the chat"
    })


@sio.event
def send_message(sid, data):
    # print("Message:", data)

    username = users.get(sid,"Anonymous")
    message = data["message"]

    sio.emit("receive_message", {
        "username": username,
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


if __name__ == "__main__":
    print("Socket.IO server running on port 5000")

    eventlet.wsgi.server(
        eventlet.listen(("0.0.0.0", 5000)),
        app
    )