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

    // عناصر لوحة النتائج (كما هي)
    const domainNameSpan = document.getElementById('domain-name');
    const domainAuthorityScoreSpan = document.getElementById('domain-authority-score');
    const domainAuthorityProgress = document.getElementById('domain-authority-progress');
    const domainAuthorityText = document.getElementById('domain-authority-text');
    const domainAgeSpan = document.getElementById('domain-age');
    const sslStatusSpan = document.getElementById('ssl-status');
    const blacklistStatusSpan = document.getElementById('blacklist-status');
    const dnsHealthSpan = document.getElementById('dns-health');

    const performanceScoreSpan = document.getElementById('performance-score');
    const performanceProgress = document.getElementById('performance-progress');
    const performanceText = document.getElementById('performance-text');
    const coreWebVitalsList = document.getElementById('core-web-vitals');
    const performanceIssuesList = document.getElementById('performance-issues');
    const pagespeedLink = document.getElementById('pagespeed-link');

    const seoOverallScoreSpan = document.getElementById('seo-overall-score');
    const seoOverallProgress = document.getElementById('seo-overall-progress');
    const seoOverallText = document.getElementById('seo-overall-text');
    const seoTitleSpan = document.getElementById('seo-title');
    const seoMetaDescriptionSpan = document.getElementById('seo-meta-description');
    const seoBrokenLinksSpan = document.getElementById('seo-broken-links');
    const seoMissingAltSpan = document.getElementById('seo-missing-alt');
    const seoInternalLinksSpan = document.getElementById('seo-internal-links');
    const seoExternalLinksSpan = document.getElementById('seo-external-links');
    const hTagsList = document.getElementById('h-tags-list');
    const keywordDensityList = document.getElementById('keyword-density-list');
    const seoImprovementTipsList = document.getElementById('seo-improvement-tips');
    const aiSeoSuggestionsSection = document.getElementById('ai-seo-suggestions-section');
    const aiSeoSuggestionsText = document.getElementById('ai-seo-suggestions-text');

    const uxIssuesList = document.getElementById('ux-issues-list');
    const uxSuggestionsList = document.getElementById('ux-suggestions-list');
    const aiContentInsightsSection = document.getElementById('ai-content-insights-section');
    const aiContentInsightsText = document.getElementById('ai-content-insights-text');

    const aiSummarySection = document.getElementById('ai-summary-section');
    const aiSummaryText = document.getElementById('ai-summary-text');


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
            // استخدام المسار النسبي /analyze لأن الواجهة الأمامية والخلفية في نفس الخدمة
            const backendApiUrl = `/analyze`; 
            console.log("Sending POST request to:", backendApiUrl); 

            const controller = new AbortController(); 
            const timeoutId = setTimeout(() => controller.abort(), 120000); // مهلة 120 ثانية (2 دقيقة)

            const response = await fetch(backendApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url }),
                signal: controller.signal 
            });

            clearTimeout(timeoutId); 

            console.log("Received response from backend. Status:", response.status); 

            if (!response.ok) {
                const errorText = await response.text(); 
                console.error("Backend response not OK. Raw text:", errorText); 
                try {
                    const errorData = JSON.parse(errorText); 
                    throw new Error(errorData.error || `Server error: ${response.status}`);
                } catch (jsonError) {
                    throw new Error(`Server returned non-JSON error (Status: ${response.status}): ${errorText.substring(0, 100)}...`);
                }
            }

            const results = await response.json();
            console.log("Received results from backend:", results); 

            window.lastAnalysisResults = results; 

            hideElement(loadingSpinner); 
            displayResults(url, results); 

        } catch (error) {
            console.error('Analysis failed:', error);
            if (error.name === 'AbortError') {
                displayError('Analysis timed out. The server took too long to respond. Please try again later.');
            } else if (error instanceof TypeError && error.message.includes('Network request failed')) {
                displayError('Network error. Could not connect to the server. Please check your internet connection and try again.');
            } else {
                displayError(`Analysis failed: ${error.message}. Please try again later.`);
            }
            hideElement(loadingSpinner); 
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
            // استخدام المسار النسبي /generate_report
            const backendReportUrl = `/generate_report`; 
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
