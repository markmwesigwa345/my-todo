from django.contrib import admin
from .models import Todo

#admin.site.register(Todo)


@admin.register(Todo)
class TodoAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'is_done', 'time')
    list_filter = ('user', 'is_done')