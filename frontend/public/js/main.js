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

    // عناصر لوحة النتائج
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
        hideElement(resultsDashboard); // تأكد من إخفاء لوحة النتائج إذا كان هناك خطأ
    };

    // وظيفة لعرض النتائج على لوحة التحكم
    function displayResults(url, results) {
        console.log("Displaying results on dashboard:", results); // Debug log
        if (analyzedUrlSpan) analyzedUrlSpan.textContent = url;
        showElement(resultsDashboard); // تأكد أن هذا السطر موجود هنا

        // Domain Authority
        const domainAuthority = results.domain_authority || {};
        domainNameSpan.textContent = domainAuthority.domain || 'N/A';
        const daScore = domainAuthority.domain_authority_score !== undefined && domainAuthority.domain_authority_score !== null ? domainAuthority.domain_authority_score : 'N/A';
        domainAuthorityScoreSpan.textContent = daScore;
        updateProgressBar(domainAuthorityProgress, daScore);
        domainAuthorityText.textContent = domainAuthority.domain_authority_text || 'N/A';
        domainAgeSpan.textContent = domainAuthority.domain_age_years ? `${domainAuthority.domain_age_years} years` : 'N/A';
        sslStatusSpan.textContent = domainAuthority.ssl_status || 'N/A';
        blacklistStatusSpan.textContent = domainAuthority.blacklist_status || 'N/A';
        dnsHealthSpan.textContent = domainAuthority.dns_health || 'N/A';

        // Page Speed
        const pageSpeed = results.page_speed || {};
        const perfScore = pageSpeed.scores && pageSpeed.scores['Performance Score'] !== undefined && pageSpeed.scores['Performance Score'] !== null ? pageSpeed.scores['Performance Score'] : 'N/A';
        performanceScoreSpan.textContent = perfScore;
        updateProgressBar(performanceProgress, perfScore);
        performanceText.textContent = pageSpeed.performance_text || 'N/A';
        pagespeedLink.href = pageSpeed.pagespeed_report_link || '#';

        // Core Web Vitals
        coreWebVitalsList.innerHTML = '';
        const coreVitals = pageSpeed.core_web_vitals || {};
        for (const metric in coreVitals) {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${metric}:</strong> ${coreVitals[metric] || 'N/A'}`;
            coreWebVitalsList.appendChild(li);
        }
        if (Object.keys(coreVitals).length === 0) {
            const li = document.createElement('li');
            li.textContent = 'No Core Web Vitals data available.';
            coreWebVitalsList.appendChild(li);
        }

        // Performance Issues
        performanceIssuesList.innerHTML = '';
        const perfIssues = pageSpeed.issues || [];
        if (perfIssues.length > 0) {
            perfIssues.forEach(issue => {
                const li = document.createElement('li');
                li.textContent = issue.title || 'Unknown issue';
                performanceIssuesList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = 'No major performance issues detected.';
            li.classList.add('text-green-600', 'dark:text-green-300'); // Add green color for no issues
            performanceIssuesList.appendChild(li);
        }


        // SEO Quality
        const seoQuality = results.seo_quality || {};
        const seoScore = seoQuality.score !== undefined && seoQuality.score !== null ? seoQuality.score : 'N/A';
        seoOverallScoreSpan.textContent = seoScore;
        updateProgressBar(seoOverallProgress, seoScore);
        seoOverallText.textContent = seoQuality.seo_overall_text || 'N/A';

        const seoElements = seoQuality.elements || {};
        seoTitleSpan.textContent = seoElements.title || 'N/A';
        seoMetaDescriptionSpan.textContent = seoElements.meta_description || 'N/A';
        seoBrokenLinksSpan.textContent = seoElements.broken_links ? seoElements.broken_links.length : '0';
        seoMissingAltSpan.textContent = seoElements.image_alt_status ? seoElements.image_alt_status.filter(s => s.includes("Missing") || s.includes("Empty")).length : '0';
        seoInternalLinksSpan.textContent = seoElements.internal_links_count !== undefined && seoElements.internal_links_count !== null ? seoElements.internal_links_count : 'N/A';
        seoExternalLinksSpan.textContent = seoElements.external_links_count !== undefined && seoElements.external_links_count !== null ? seoElements.external_links_count : 'N/A';

        // H-Tags
        hTagsList.innerHTML = '';
        const hTags = seoElements.h_tags || {};
        if (Object.keys(hTags).length > 0) {
            for (const tag in hTags) {
                const li = document.createElement('li');
                li.textContent = `${tag}: ${hTags[tag].join(', ')}`;
                hTagsList.appendChild(li);
            }
        } else {
            const li = document.createElement('li');
            li.textContent = 'No heading tags found.';
            hTagsList.appendChild(li);
        }

        // Keyword Density
        keywordDensityList.innerHTML = '';
        const keywordDensity = seoElements.keyword_density || {};
        const topKeywords = Object.entries(keywordDensity)
                                .sort(([, a], [, b]) => b - a)
                                .slice(0, 10);
        if (topKeywords.length > 0) {
            topKeywords.forEach(([keyword, density]) => {
                const li = document.createElement('li');
                li.textContent = `${keyword}: ${density}%`;
                keywordDensityList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = 'No significant keywords found.';
            keywordDensityList.appendChild(li);
        }

        // SEO Improvement Tips
        seoImprovementTipsList.innerHTML = '';
        const seoTips = seoQuality.improvement_tips || [];
        if (seoTips.length > 0) {
            seoTips.forEach(tip => {
                const li = document.createElement('li');
                li.textContent = tip;
                seoImprovementTipsList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = 'No specific SEO improvement tips at this time.';
            li.classList.add('text-green-600', 'dark:text-green-300');
            seoImprovementTipsList.appendChild(li);
        }

        // AI SEO Suggestions
        const aiInsights = results.ai_insights || {};
        if (aiInsights.seo_improvement_suggestions && aiInsights.seo_improvement_suggestions !== 'N/A') {
            aiSeoSuggestionsText.textContent = aiInsights.seo_improvement_suggestions;
            showElement(aiSeoSuggestionsSection);
        } else {
            hideElement(aiSeoSuggestionsSection);
        }


        // User Experience (UX)
        const userExperience = results.user_experience || {};

        // UX Issues
        uxIssuesList.innerHTML = '';
        const uxIssues = userExperience.issues || [];
        if (uxIssues.length > 0) {
            uxIssues.forEach(issue => {
                const li = document.createElement('li');
                li.textContent = issue;
                uxIssuesList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = 'No major UX issues detected.';
            li.classList.add('text-green-600', 'dark:text-green-300');
            uxIssuesList.appendChild(li);
        }

        // UX Suggestions
        uxSuggestionsList.innerHTML = '';
        const uxSuggestions = userExperience.suggestions || [];
        if (uxSuggestions.length > 0) {
            uxSuggestions.forEach(suggestion => {
                const li = document.createElement('li');
                li.textContent = suggestion;
                uxSuggestionsList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = 'No specific UX suggestions at this time.';
            li.classList.add('text-green-600', 'dark:text-green-300');
            uxSuggestionsList.appendChild(li);
        }

        // AI Content Insights
        if (aiInsights.content_originality_tone && aiInsights.content_originality_tone !== 'N/A') {
            aiContentInsightsText.textContent = aiInsights.content_originality_tone;
            showElement(aiContentInsightsSection);
        } else {
            hideElement(aiContentInsightsSection);
        }

        // AI Summary
        if (aiInsights.summary && aiInsights.summary !== 'N/A') {
            aiSummaryText.textContent = aiInsights.summary;
            showElement(aiSummarySection);
        } else {
            hideElement(aiSummarySection);
        }
    }

    // معالج حدث زر التحليل
    analyzeButton.addEventListener('click', async () => {
        const url = websiteUrlInput.value.trim();
        hideElement(errorMessage);
        hideElement(resultsDashboard); // إخفاء لوحة النتائج القديمة
        showElement(loadingSpinner); // إظهار مؤشر التحميل

        if (!url) {
            displayError('Please enter a website URL.');
            return;
        }

        try {
            const response = await fetch('/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Network response was not ok.');
            }

            const results = await response.json();
            console.log("Received results from backend:", results); // Debug log

            hideElement(loadingSpinner); // إخفاء مؤشر التحميل بعد استلام النتائج
            displayResults(url, results); // عرض النتائج

        } catch (error) {
            console.error('Analysis failed:', error);
            displayError(`Analysis failed: ${error.message}. Please try again later.`);
        }
    });

    // معالج حدث زر "Analyze Another"
    analyzeAnotherButton.addEventListener('click', () => {
        hideElement(resultsDashboard);
        hideElement(errorMessage);
        websiteUrlInput.value = ''; // مسح حقل URL
        showElement(document.getElementById('input-section')); // إظهار قسم الإدخال
    });

    // معالج حدث زر تصدير PDF
    exportPdfButton.addEventListener('click', async () => {
        const currentUrl = analyzedUrlSpan.textContent;
        if (!currentUrl || !window.lastAnalysisResults) {
            displayError('No analysis results to export. Please run an analysis first.');
            return;
        }

        // إظهار مؤشر تحميل صغير لزر التصدير (اختياري)
        exportPdfButton.textContent = 'Generating PDF...';
        exportPdfButton.disabled = true;

        try {
            const response = await fetch('/generate_report', {
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
        // حفظ تفضيل المستخدم
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

    // حفظ آخر نتائج تحليل في متغير عام للوصول إليها عند تصدير PDF
    // هذا سيتم تعيينه داخل دالة analyzeButton.addEventListener
    // window.lastAnalysisResults = results;
});
