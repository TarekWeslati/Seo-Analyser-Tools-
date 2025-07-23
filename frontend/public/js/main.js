document.addEventListener('DOMContentLoaded', () => {
    // ... (باقي تعريفات العناصر كما هي) ...

    // وظائف مساعدة لإظهار/إخفاء العناصر
    const showElement = (element) => element.classList.remove('hidden');
    const hideElement = (element) => element.classList.add('hidden');

    // وظيفة لتحديث شريط التقدم واللون
    const updateProgressBar = (progressBarElement, score) => {
        let width = 0;
        let colorClass = 'progress-bad'; // افتراضيًا سيء

        if (score !== null && !isNaN(score)) {
            width = Math.max(0, Math.min(100, score)); // تأكد أن النتيجة بين 0 و 100
            if (score >= 80) {
                colorClass = 'progress-good';
            } else if (score >= 50) {
                colorClass = 'progress-medium';
            } else {
                colorClass = 'progress-bad';
            }
        }

        progressBarElement.style.width = `${width}%`;
        progressBarElement.className = `progress-bar ${colorClass}`;
    };

    // وظيفة لعرض رسالة خطأ
    const displayError = (message) => {
        errorMessage.textContent = message;
        showElement(errorMessage);
        hideElement(loadingSpinner);
        hideElement(resultsDashboard); 
        console.error("Displaying error message:", message); // تسجيل: عرض رسالة خطأ
    };

    // وظيفة لعرض النتائج على لوحة التحكم
    function displayResults(url, results) {
        console.log("Displaying results on dashboard:", results); 
        if (analyzedUrlSpan) analyzedUrlSpan.textContent = url;
        showElement(resultsDashboard); 
        hideElement(loadingSpinner); // تأكد من إخفاء مؤشر التحميل هنا أيضاً

        // ... (باقي كود ملء البيانات في لوحة النتائج كما هو) ...
    }

    // معالج حدث زر التحليل
    analyzeButton.addEventListener('click', async () => {
        const url = websiteUrlInput.value.trim();
        hideElement(errorMessage);
        hideElement(resultsDashboard); 
        showElement(loadingSpinner); 
        console.log("Analyze button clicked. URL:", url); // تسجيل: النقر على زر التحليل

        if (!url) {
            displayError('Please enter a website URL.');
            return;
        }

        try {
            console.log("Sending POST request to /analyze..."); // تسجيل: إرسال الطلب
            const response = await fetch('/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url }),
            });

            console.log("Received response from backend. Status:", response.status); // تسجيل: استلام الاستجابة

            if (!response.ok) {
                const errorText = await response.text(); // احصل على النص الخام للاستجابة
                console.error("Backend response not OK. Raw text:", errorText); // تسجيل: الاستجابة الخام
                try {
                    const errorData = JSON.parse(errorText); // حاول تحليلها كـ JSON
                    throw new Error(errorData.error || 'Network response was not ok.');
                } catch (jsonError) {
                    // إذا لم تكن JSON، استخدم النص الخام
                    throw new Error(`Server returned non-JSON error: ${errorText.substring(0, 100)}...`);
                }
            }

            const results = await response.json();
            console.log("Received results from backend:", results); 

            // حفظ آخر نتائج تحليل في متغير عام للوصول إليها عند تصدير PDF
            window.lastAnalysisResults = results; // تأكد من وجود هذا السطر

            hideElement(loadingSpinner); 
            displayResults(url, results); 

        } catch (error) {
            console.error('Analysis failed:', error);
            displayError(`Analysis failed: ${error.message}. Please try again later.`);
        }
    });

    // ... (باقي كود الأزرار الأخرى و themeToggle كما هو) ...
});
