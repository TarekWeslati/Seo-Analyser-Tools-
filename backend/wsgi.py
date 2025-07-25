import sys
import os

# هذا السطر مهم جداً. يضيف مسار مجلد 'backend' إلى مسارات البايثون
# حتى يتمكن من العثور على ملف 'app.py' داخله.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

# استيراد كائن التطبيق (الذي اسمه 'app' في ملف 'app.py' داخل 'backend')
# وتسميته 'application' هنا لتجنب أي تعارضات محتملة في الأسماء.
from backend.app import app as application

# Gunicorn يتوقع العثور على كائن باسم 'app' عند تشغيله بالأمر 'wsgi:app'.
# لذلك، نجعل المتغير 'app' يشير إلى الكائن المستورد 'application'.
app = application
