from django.http import JsonResponse
from chat_app.models import Message
from django.views.decorators.csrf import csrf_exempt


@csrf_exempt
def upload_file(req):
    if req.method == "POST":
        file = req.FILES.get("file")

        msg = Message.objects.create(
            file=file,
            file_name=file.name,
            msg_type="file"
        )

        return JsonResponse({
            "file_url":req.build_absolute_uri(msg.file.url),
            "file_name":file.name
        })