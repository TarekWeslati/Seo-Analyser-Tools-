# wsgi.py
import sys
import os

# أضف مسار مجلد backend إلى sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from backend.app import app as application # استيراد كائن الـ app من app.py

# إذا كنت تستخدم gunicorn app:app
# gunicorn سيحاول استيراد app من ملف اسمه app.py أو wsgi.py
# هذا الملف wsgi.py في الجذر سيتكفل بالاستيراد الصحيح
# اسم المتغير app هنا يجب أن يطابق ما هو في Procfile
app = application
