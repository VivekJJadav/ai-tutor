# tutor/views.py
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from .models import Subject, Chapter

def ajax_login_required(func):
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'Authentication required'}, status=401)
        return func(request, *args, **kwargs)
    return wrapper

@ajax_login_required
def subjects_view(request):
    subjects = Subject.objects.all()
    subjects_data = [
        {
            'id': subject.id,
            'name': subject.name
        }
        for subject in subjects
    ]
    return JsonResponse({'subjects': subjects_data})

@ajax_login_required
def chapters_view(request, subject_id):
    try:
        from accounts.models import StudentProfile
        profile = StudentProfile.objects.get(user=request.user)

        if not profile.standard_selected:
            return JsonResponse({'error': 'Standard not selected'}, status=400)

        standard = profile.standard

        chapters = Chapter.objects.filter(
            subject_id=subject_id,
            standard=standard
        )
        
        chapters_data = [
            {
                'id': chapter.id,
                'title': chapter.title,
                'order': chapter.order,
                'subject_id': chapter.subject.id
            }
            for chapter in chapters
        ]

        return JsonResponse(chapters_data, safe=False)
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)