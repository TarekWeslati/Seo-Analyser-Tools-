document.addEventListener('DOMContentLoaded', () => {
    const websiteUrlInput = document.getElementById('website-url');
    const analyzeButton = document.getElementById('analyze-button');
    const errorMessage = document.getElementById('error-message');
    const loadingSpinner = document.getElementById('loading-spinner');
    const resultsDashboard = document.getElementById('results-dashboard');
    const analyzedUrlSpan = document.getElementById('analyzed-url');
    const analyzeAnotherButton = document.getElementById('analyze-another-button');
    const exportPdfButton = document.getElementById('export-pdf-button');
    const themeToggle = document.getElementById('theme-toggle');

    // ... (باقي تعريفات العناصر كما هي) ...

    // وظائف مساعدة لإظهار/إخفاء العناصر
    const showElement = (element) => element.classList.remove('hidden');
    const hideElement = (element) => element.classList.add('hidden');

    // وظيفة لتحديث شريط التقدم واللون
    const updateProgressBar = (progressBarElement, score) => {
        let width = 0;
        let colorClass = 'progress-bad'; 

        if (score !== null && !isNaN(score)) {
            width = Math.max(0, Math.min(100, score)); 
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
        console.error("Displaying error message:", message); 
    };

    // وظيفة لعرض النتائج على لوحة التحكم
    function displayResults(url, results) {
        console.log("Displaying results on dashboard:", results); 
        if (analyzedUrlSpan) analyzedUrlSpan.textContent = url;
        showElement(resultsDashboard); 
        hideElement(loadingSpinner); 

        // ... (باقي كود ملء البيانات في لوحة النتائج كما هو) ...
    }

    // معالج حدث زر التحليل
    analyzeButton.addEventListener('click', async () => {
        const url = websiteUrlInput.value.trim();
        hideElement(errorMessage);
        hideElement(resultsDashboard); 
        showElement(loadingSpinner); 
        console.log("Analyze button clicked. URL:", url); 

        if (!url) {
            displayError('Please enter a website URL.');
            return;
        }

        try {
            // ****** التغيير الرئيسي هنا: استخدام مسار مطلق للـ Backend ******
            // يجب أن يكون هذا هو عنوان URL لخدمة الـ Backend الخاصة بك على Render
            // مثال: const backendUrl = 'https://your-backend-service-name.onrender.com';
            // سأفترض أنك ستستخدم نفس النطاق الحالي، ولكن مع المسار API
            // إذا كان الـ Frontend والـ Backend على نفس النطاق الفرعي، يمكن استخدام المسار النسبي
            // ولكن لتجنب المشاكل، دعنا نستخدم window.location.origin
            const backendApiUrl = `${window.location.origin}/analyze`; 
            console.log("Sending POST request to:", backendApiUrl); 

            const response = await fetch(backendApiUrl, { // استخدام backendApiUrl هنا
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url }),
            });

            console.log("Received response from backend. Status:", response.status); 

            if (!response.ok) {
                const errorText = await response.text(); 
                console.error("Backend response not OK. Raw text:", errorText); 
                try {
                    const errorData = JSON.parse(errorText); 
                    throw new Error(errorData.error || 'Network response was not ok.');
                } catch (jsonError) {
                    throw new Error(`Server returned non-JSON error: ${errorText.substring(0, 100)}...`);
                }
            }

            const results = await response.json();
            console.log("Received results from backend:", results); 

            window.lastAnalysisResults = results; 

            hideElement(loadingSpinner); 
            displayResults(url, results); 

        } catch (error) {
            console.error('Analysis failed:', error);
            displayError(`Analysis failed: ${error.message}. Please try again later.`);
        }
    });

    // معالج حدث زر "Analyze Another"
    analyzeAnotherButton.addEventListener('click', () => {
        hideElement(resultsDashboard);
        hideElement(errorMessage);
        websiteUrlInput.value = ''; 
        showElement(document.getElementById('input-section')); 
    });

    // معالج حدث زر تصدير PDF
    exportPdfButton.addEventListener('click', async () => {
        const currentUrl = analyzedUrlSpan.textContent;
        if (!currentUrl || !window.lastAnalysisResults) {
            displayError('No analysis results to export. Please run an analysis first.');
            return;
        }

        exportPdfButton.textContent = 'Generating PDF...';
        exportPdfButton.disabled = true;

        try {
            const backendReportUrl = `${window.location.origin}/generate_report`; // استخدام مسار مطلق هنا أيضاً
            const response = await fetch(backendReportUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url: currentUrl, results: window.lastAnalysisResults }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate PDF report.');
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `${currentUrl.replace(/[^a-z0-9]/gi, '_')}_analysis_report.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(downloadUrl);

        } catch (error) {
            console.error('PDF export failed:', error);
            displayError(`PDF export failed: ${error.message}`);
        } finally {
            exportPdfButton.textContent = 'Export PDF Report';
            exportPdfButton.disabled = false;
        }
    });

    // تبديل الوضع الداكن/الفاتح
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        if (document.body.classList.contains('dark')) {
            localStorage.setItem('theme', 'dark');
        } else {
            localStorage.setItem('theme', 'light');
        }
    });

    // تحميل تفضيل الوضع عند التحميل
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
    }
});
