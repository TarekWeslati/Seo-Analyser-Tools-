const API_BASE_URL = 'http://127.0.0.1:5000'; // عنوان URL للخلفية، سيصبح مختلفًا عند النشر

const websiteUrlInput = document.getElementById('website-url');
const analyzeButton = document.getElementById('analyze-button');
const errorMessage = document.getElementById('error-message');
const loadingSpinner = document.getElementById('loading-spinner');
const resultsDashboard = document.getElementById('results-dashboard');

const analyzedUrlSpan = document.getElementById('analyzed-url');
const seoScoreDiv = document.getElementById('seo-score');
const speedScoreDiv = document.getElementById('speed-score');
const uxScoreDiv = document.getElementById('ux-score');

// ملخص الذكاء الاصطناعي
const aiSummarySection = document.getElementById('ai-summary-section');
const aiSummaryText = document.getElementById('ai-summary-text');

// سلطة النطاق
const domainNameSpan = document.getElementById('domain-name');
const domainAuthorityEstimateSpan = document.getElementById('domain-authority-estimate');
const domainAgeSpan = document.getElementById('domain-age');
const sslStatusSpan = document.getElementById('ssl-status');
const blacklistStatusSpan = document.getElementById('blacklist-status');
const dnsHealthSpan = document.getElementById('dns-health');

// سرعة الصفحة
const coreWebVitalsList = document.getElementById('core-web-vitals');
const performanceIssuesList = document.getElementById('performance-issues');
const pagespeedLink = document.getElementById('pagespeed-link');

// SEO
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


// تجربة المستخدم (UX)
const uxIssuesList = document.getElementById('ux-issues-list');
const uxSuggestionsList = document.getElementById('ux-suggestions-list');
const aiContentInsightsSection = document.getElementById('ai-content-insights-section');
const aiContentInsightsText = document.getElementById('ai-content-insights-text');


// أزرار الإجراءات
const analyzeAnotherButton = document.getElementById('analyze-another-button');
const exportPdfButton = document.getElementById('export-pdf-button');

let currentAnalysisResults = null; // تخزين النتائج لتصدير PDF

// --- تبديل الوضع الليلي/النهاري ---
const themeToggle = document.getElementById('theme-toggle');
const htmlElement = document.documentElement;

themeToggle.addEventListener('click', () => {
    htmlElement.classList.toggle('dark');
    // تخزين تفضيل المستخدم في localStorage
    if (htmlElement.classList.contains('dark')) {
        localStorage.setItem('theme', 'dark');
    } else {
        localStorage.setItem('theme', 'light');
    }
});

// تطبيق الثيم المحفوظ عند التحميل
if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    htmlElement.classList.add('dark');
} else {
    htmlElement.classList.remove('dark');
}


// --- وظائف مساعدة ---
function showElement(element) {
    element.classList.remove('hidden');
}

function hideElement(element) {
    element.classList.add('hidden');
}

function setScoreBadge(element, score) {
    // تنسيق النص للرقم
    element.textContent = score !== null && score !== undefined ? `${Math.round(score)}` : 'N/A';
    // إزالة كلاسات الألوان القديمة
    element.classList.remove('text-green-600', 'dark:text-green-400', 'text-orange-600', 'dark:text-orange-400', 'text-red-600', 'dark:text-red-400');

    if (score === 'N/A' || score === null || score === undefined) return;

    // إضافة الكلاسات بناءً على النتيجة
    if (score >= 70) {
        element.classList.add('text-green-600', 'dark:text-green-400');
    } else if (score >= 40) {
        element.classList.add('text-orange-600', 'dark:text-orange-400');
    } else {
        element.classList.add('text-red-600', 'dark:text-red-400');
    }
}


function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (e) {
        return false;
    }
}

function clearResults() {
    resultsDashboard.classList.add('hidden');
    errorMessage.classList.add('hidden');
    websiteUrlInput.value = '';
    // مسح جميع النصوص والقوائم
    analyzedUrlSpan.textContent = '';
    setScoreBadge(seoScoreDiv, null);
    setScoreBadge(speedScoreDiv, null);
    setScoreBadge(uxScoreDiv, null);

    aiSummarySection.classList.add('hidden');
    aiSummaryText.textContent = '';

    domainNameSpan.textContent = '';
    domainAuthorityEstimateSpan.textContent = '';
    domainAgeSpan.textContent = '';
    sslStatusSpan.textContent = '';
    blacklistStatusSpan.textContent = '';
    dnsHealthSpan.textContent = '';

    coreWebVitalsList.innerHTML = '';
    performanceIssuesList.innerHTML = '';
    pagespeedLink.href = '#';

    seoTitleSpan.textContent = '';
    seoMetaDescriptionSpan.textContent = '';
    seoBrokenLinksSpan.textContent = '';
    seoMissingAltSpan.textContent = '';
    seoInternalLinksSpan.textContent = '';
    seoExternalLinksSpan.textContent = '';
    hTagsList.innerHTML = '';
    keywordDensityList.innerHTML = '';
    seoImprovementTipsList.innerHTML = '';
    aiSeoSuggestionsSection.classList.add('hidden');
    aiSeoSuggestionsText.textContent = '';

    uxIssuesList.innerHTML = '';
    uxSuggestionsList.innerHTML = '';
    aiContentInsightsSection.classList.add('hidden');
    aiContentInsightsText.textContent = '';
}


// --- منطق التحليل الرئيسي ---
analyzeButton.addEventListener('click', async () => {
    const url = websiteUrlInput.value.trim();
    if (!isValidUrl(url)) {
        errorMessage.textContent = "يرجى إدخال رابط صالح (مثال: https://example.com).";
        showElement(errorMessage);
        hideElement(resultsDashboard);
        return;
    }

    errorMessage.classList.add('hidden');
    hideElement(resultsDashboard);
    showElement(loadingSpinner);
    currentAnalysisResults = null; // مسح النتائج السابقة

    try {
        const response = await fetch(`${API_BASE_URL}/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: url }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'حدث خطأ ما أثناء التحليل.');
        }

        const data = await response.json();
        currentAnalysisResults = data; // تخزين النتائج
        displayResults(url, data);

    } catch (error) {
        errorMessage.textContent = `فشل التحليل: ${error.message}`;
        showElement(errorMessage);
        console.error('خطأ في التحليل:', error);
    } finally {
        hideElement(loadingSpinner);
    }
});

function displayResults(url, results) {
    analyzedUrlSpan.textContent = url;
    showElement(resultsDashboard);

    // النتائج الإجمالية
    setScoreBadge(seoScoreDiv, results.seo_quality?.score);
    setScoreBadge(speedScoreDiv, results.page_speed?.scores?.['Performance Score']);
    setScoreBadge(uxScoreDiv, results.user_experience?.score);

    // ملخص الذكاء الاصطناعي
    if (results.ai_insights?.summary) {
        showElement(aiSummarySection);
        aiSummaryText.textContent = results.ai_insights.summary;
    } else {
        hideElement(aiSummarySection);
    }

    // سلطة النطاق والثقة
    const domainData = results.domain_authority || {};
    domainNameSpan.textContent = domainData.domain || 'N/A';
    domainAuthorityEstimateSpan.textContent = domainData.domain_authority_estimate || 'N/A';
    domainAgeSpan.textContent = domainData.domain_age_years !== undefined ? `${domainData.domain_age_years} سنة` : 'N/A';
    sslStatusSpan.textContent = domainData.ssl_status || 'N/A';
    blacklistStatusSpan.textContent = domainData.blacklist_status || 'N/A';
    dnsHealthSpan.textContent = domainData.dns_health || 'N/A';

    // سرعة وأداء الصفحة
    const pageSpeedData = results.page_speed || {};
    coreWebVitalsList.innerHTML = '';
    if (pageSpeedData.metrics) {
        for (const metric in pageSpeedData.metrics) {
            if (pageSpeedData.metrics[metric]) {
                const li = document.createElement('li');
                li.innerHTML = `<strong>${metric}:</strong> ${pageSpeedData.metrics[metric]}`;
                coreWebVitalsList.appendChild(li);
            }
        }
    }

    performanceIssuesList.innerHTML = '';
    if (pageSpeedData.issues && pageSpeedData.issues.length > 0) {
        pageSpeedData.issues.forEach(issue => {
            const li = document.createElement('li');
            li.textContent = `${issue.title} ${issue.score !== undefined ? `(النتيجة: ${Math.round(issue.score)})` : ''}: ${issue.description || ''}`;
            if (issue.images && issue.images.length > 0) {
                li.textContent += ` الصور: ${issue.images.join(', ')}`;
            }
            performanceIssuesList.appendChild(li);
        });
    } else {
        const li = document.createElement('li');
        li.textContent = 'لا توجد مشكلات أداء رئيسية مكتشفة.';
        li.classList.add('text-green-600', 'dark:text-green-400');
        performanceIssuesList.appendChild(li);
    }
    pagespeedLink.href = pageSpeedData.full_report_link || '#';

    // جودة وهيكل الـ SEO
    const seoData = results.seo_quality?.elements || {};
    seoTitleSpan.textContent = seoData.title || 'N/A';
    seoMetaDescriptionSpan.textContent = seoData.meta_description || 'N/A';
    seoBrokenLinksSpan.textContent = seoData.broken_links ? seoData.broken_links.length : 'N/A';
    seoMissingAltSpan.textContent = seoData.image_alt_status ? seoData.image_alt_status.filter(s => s.includes('Missing') || s.includes('Empty')).length : 'N/A';
    seoInternalLinksSpan.textContent = seoData.internal_links_count || 'N/A';
    seoExternalLinksSpan.textContent = seoData.external_links_count || 'N/A';

    hTagsList.innerHTML = '';
    if (seoData.h_tags) {
        for (const tag in seoData.h_tags) {
            if (seoData.h_tags[tag].length > 0) {
                const li = document.createElement('li');
                li.textContent = `${tag}: ${seoData.h_tags[tag].join(', ')}`;
                hTagsList.appendChild(li);
            }
        }
    }

    keywordDensityList.innerHTML = '';
    if (seoData.keyword_density) {
        for (const keyword in seoData.keyword_density) {
            const li = document.createElement('li');
            li.textContent = `${keyword}: ${seoData.keyword_density[keyword]}`;
            keywordDensityList.appendChild(li);
        }
    }

    seoImprovementTipsList.innerHTML = '';
    if (results.seo_quality?.improvement_tips && results.seo_quality.improvement_tips.length > 0) {
        results.seo_quality.improvement_tips.forEach(tip => {
            const li = document.createElement('li');
            li.textContent = tip;
            seoImprovementTipsList.appendChild(li);
        });
    } else {
        const li = document.createElement('li');
        li.textContent = 'يبدو جيدًا! لا توجد مشكلات SEO حرجة مكتشفة بناءً على تحليلنا.';
        seoImprovementTipsList.appendChild(li);
    }

    if (results.ai_insights?.seo_improvement_suggestions) {
        showElement(aiSeoSuggestionsSection);
        aiSeoSuggestionsText.textContent = results.ai_insights.seo_improvement_suggestions;
    } else {
        hideElement(aiSeoSuggestionsSection);
    }

    // تجربة المستخدم (UX)
    const uxData = results.user_experience || {};
    uxIssuesList.innerHTML = '';
    if (uxData.issues && uxData.issues.length > 0) {
        uxData.issues.forEach(issue => {
            const li = document.createElement('li');
            li.textContent = issue;
            uxIssuesList.appendChild(li);
        });
    } else {
        const li = document.createElement('li');
        li.textContent = 'لا توجد مشكلات UX رئيسية مكتشفة بناءً على تحليلنا الاستدلالي.';
        li.classList.add('text-green-600', 'dark:text-green-400');
        uxIssuesList.appendChild(li);
    }

    uxSuggestionsList.innerHTML = '';
    if (uxData.suggestions && uxData.suggestions.length > 0) {
        uxData.suggestions.forEach(suggestion => {
            const li = document.createElement('li');
            li.textContent = suggestion;
            uxSuggestionsList.appendChild(li);
        });
    }

    if (results.ai_insights?.content_originality_tone) {
        showElement(aiContentInsightsSection);
        aiContentInsightsText.textContent = results.ai_insights.content_originality_tone;
    } else {
        hideElement(aiContentInsightsSection);
    }
}


// --- معالجات أحداث أزرار الإجراءات ---
analyzeAnotherButton.addEventListener('click', () => {
    clearResults();
    // العودة إلى أعلى الصفحة أو قسم الإدخال
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

exportPdfButton.addEventListener('click', async () => {
    if (!currentAnalysisResults) {
        alert("يرجى تحليل موقع ويب أولاً لتوليد تقرير.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/generate_report`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: websiteUrlInput.value.trim(), results: currentAnalysisResults }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'فشل توليد تقرير PDF.');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        // إنشاء اسم ملف مناسب
        const filename = `${websiteUrlInput.value.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\//g, '_')}_analysis_report.pdf`;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        alert(`خطأ في توليد PDF: ${error.message}`);
        console.error('خطأ في توليد PDF:', error);
    }
});
