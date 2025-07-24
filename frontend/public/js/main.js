document.addEventListener('DOMContentLoaded', () => {
    console.log("=== DOM LOADED - INITIALIZING APP ===");
    
    // تعريف جميع العناصر مع فحص وجودها
    const websiteUrlInput = document.getElementById('website-url');
    const analyzeButton = document.getElementById('analyze-button');
    const errorMessage = document.getElementById('error-message');
    const loadingSpinner = document.getElementById('loading-spinner');
    const resultsDashboard = document.getElementById('results-dashboard');
    const analyzedUrlSpan = document.getElementById('analyzed-url');
    const analyzeAnotherButton = document.getElementById('analyze-another-button');
    const exportPdfButton = document.getElementById('export-pdf-button');
    const themeToggle = document.getElementById('theme-toggle');
    
    // فحص وجود العناصر المطلوبة
    const requiredElements = {
        'website-url': websiteUrlInput,
        'analyze-button': analyzeButton,
        'error-message': errorMessage,
        'loading-spinner': loadingSpinner,
        'results-dashboard': resultsDashboard
    };
    
    console.log("=== CHECKING REQUIRED ELEMENTS ===");
    let missingElements = [];
    for (const [id, element] of Object.entries(requiredElements)) {
        if (!element) {
            missingElements.push(id);
            console.error(`❌ Missing element: ${id}`);
        } else {
            console.log(`✅ Found element: ${id}`);
        }
    }
    
    if (missingElements.length > 0) {
        console.error("❌ CRITICAL: Missing required HTML elements:", missingElements);
        alert(`خطأ: عناصر HTML مفقودة: ${missingElements.join(', ')}`);
        return;
    }

    // تعريف عناصر النتائج (ستكون null إذا لم توجد)
    const seoScoreElement = document.getElementById('seo-score');
    const seoProgressBar = document.getElementById('seo-progress-bar');
    const performanceScoreElement = document.getElementById('performance-score');
    const performanceProgressBar = document.getElementById('performance-progress-bar');
    const accessibilityScoreElement = document.getElementById('accessibility-score');
    const accessibilityProgressBar = document.getElementById('accessibility-progress-bar');
    const bestPracticesScoreElement = document.getElementById('best-practices-score');
    const bestPracticesProgressBar = document.getElementById('best-practices-progress-bar');
    
    // عناصر تفاصيل التحليل
    const titleElement = document.getElementById('page-title');
    const descriptionElement = document.getElementById('page-description');
    const h1CountElement = document.getElementById('h1-count');
    const h2CountElement = document.getElementById('h2-count');
    const imageCountElement = document.getElementById('image-count');
    const altMissingElement = document.getElementById('alt-missing');
    const internalLinksElement = document.getElementById('internal-links');
    const externalLinksElement = document.getElementById('external-links');
    const pageSizeElement = document.getElementById('page-size');
    const loadTimeElement = document.getElementById('load-time');
    const mobileFriendlyElement = document.getElementById('mobile-friendly');
    const httpsElement = document.getElementById('https-status');
    
    // عناصر التوصيات
    const seoIssuesList = document.getElementById('seo-issues-list');
    const performanceIssuesList = document.getElementById('performance-issues-list');
    const accessibilityIssuesList = document.getElementById('accessibility-issues-list');

    console.log("=== ELEMENTS INITIALIZATION COMPLETE ===");

    // وظائف مساعدة لإظهار/إخفاء العناصر
    const showElement = (element) => {
        if (element) {
            element.classList.remove('hidden');
            console.log("✅ Showing element:", element.id || element.className);
        }
    };
    
    const hideElement = (element) => {
        if (element) {
            element.classList.add('hidden');
            console.log("➖ Hiding element:", element.id || element.className);
        }
    };

    // وظيفة لتحديث شريط التقدم واللون
    const updateProgressBar = (progressBarElement, score) => {
        if (!progressBarElement) {
            console.warn("⚠️ Progress bar element not found");
            return;
        }
        
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
        console.log(`📊 Updated progress bar: ${width}% (${colorClass})`);
    };

    // وظيفة لعرض قائمة التوصيات
    const displayRecommendationsList = (listElement, issues) => {
        if (!listElement) {
            console.warn("⚠️ Recommendations list element not found");
            return;
        }
        
        listElement.innerHTML = '';
        if (issues && issues.length > 0) {
            issues.forEach(issue => {
                const li = document.createElement('li');
                li.textContent = issue;
                li.className = 'recommendation-item';
                listElement.appendChild(li);
            });
            console.log(`📝 Added ${issues.length} recommendations to list`);
        } else {
            const li = document.createElement('li');
            li.textContent = 'لا توجد مشاكل للإبلاغ عنها';
            li.className = 'recommendation-item success';
            listElement.appendChild(li);
            console.log("✅ No issues found for this category");
        }
    };

    // وظيفة لعرض رسالة خطأ
    const displayError = (message) => {
        console.error("❌ DISPLAYING ERROR:", message);
        if (errorMessage) {
            errorMessage.textContent = message;
            showElement(errorMessage);
        }
        hideElement(loadingSpinner);
        hideElement(resultsDashboard);
    };

    // وظيفة لعرض النتائج على لوحة التحكم
    function displayResults(url, results) {
        console.log("=== DISPLAYING RESULTS ===");
        console.log("URL:", url);
        console.log("Results data:", results);
        
        if (analyzedUrlSpan) {
            analyzedUrlSpan.textContent = url;
        }
        
        showElement(resultsDashboard);
        hideElement(loadingSpinner);

        // تحديث النتائج الأساسية
        try {
            // تحديث نقاط SEO
            if (seoScoreElement && results.seo_score !== undefined) {
                seoScoreElement.textContent = `${Math.round(results.seo_score)}%`;
                updateProgressBar(seoProgressBar, results.seo_score);
            }

            // تحديث نقاط الأداء
            if (performanceScoreElement && results.performance_score !== undefined) {
                performanceScoreElement.textContent = `${Math.round(results.performance_score)}%`;
                updateProgressBar(performanceProgressBar, results.performance_score);
            }

            // تحديث نقاط إمكانية الوصول
            if (accessibilityScoreElement && results.accessibility_score !== undefined) {
                accessibilityScoreElement.textContent = `${Math.round(results.accessibility_score)}%`;
                updateProgressBar(accessibilityProgressBar, results.accessibility_score);
            }

            // تحديث أفضل الممارسات
            if (bestPracticesScoreElement && results.best_practices_score !== undefined) {
                bestPracticesScoreElement.textContent = `${Math.round(results.best_practices_score)}%`;
                updateProgressBar(bestPracticesProgressBar, results.best_practices_score);
            }

            // تحديث تفاصيل الصفحة
            if (titleElement) titleElement.textContent = results.title || 'غير متوفر';
            if (descriptionElement) descriptionElement.textContent = results.description || 'غير متوفر';
            if (h1CountElement) h1CountElement.textContent = results.h1_count || 0;
            if (h2CountElement) h2CountElement.textContent = results.h2_count || 0;
            if (imageCountElement) imageCountElement.textContent = results.image_count || 0;
            if (altMissingElement) altMissingElement.textContent = results.images_without_alt || 0;
            if (internalLinksElement) internalLinksElement.textContent = results.internal_links || 0;
            if (externalLinksElement) externalLinksElement.textContent = results.external_links || 0;
            if (pageSizeElement) pageSizeElement.textContent = results.page_size || 'غير متوفر';
            if (loadTimeElement) loadTimeElement.textContent = results.load_time || 'غير متوفر';
            if (mobileFriendlyElement) mobileFriendlyElement.textContent = results.mobile_friendly ? 'نعم' : 'لا';
            if (httpsElement) httpsElement.textContent = results.https_status ? 'آمن' : 'غير آمن';

            // تحديث التوصيات
            displayRecommendationsList(seoIssuesList, results.seo_issues);
            displayRecommendationsList(performanceIssuesList, results.performance_issues);
            displayRecommendationsList(accessibilityIssuesList, results.accessibility_issues);

            console.log("✅ Results displayed successfully");
            
        } catch (error) {
            console.error("❌ Error displaying results:", error);
            displayError(`خطأ في عرض النتائج: ${error.message}`);
        }
    }

    // معالج حدث زر التحليل
    analyzeButton.addEventListener('click', async () => {
        console.log("=== ANALYZE BUTTON CLICKED ===");
        console.log("🔘 Button clicked!");
        console.log("📱 User Agent:", navigator.userAgent);
        console.log("🌐 Current URL:", window.location.href);
        console.log("🔍 Elements check:");
        console.log("  - websiteUrlInput:", websiteUrlInput ? "✅" : "❌");
        console.log("  - loadingSpinner:", loadingSpinner ? "✅" : "❌");
        console.log("  - errorMessage:", errorMessage ? "✅" : "❌");
        console.log("  - resultsDashboard:", resultsDashboard ? "✅" : "❌");
        
        const url = websiteUrlInput.value.trim();
        console.log("📝 Input URL:", url);
        console.log("🎯 Backend API URL will be:", `${window.location.origin}/analyze`);
        
        // إخفاء رسائل الخطأ والنتائج السابقة
        hideElement(errorMessage);
        hideElement(resultsDashboard);
        showElement(loadingSpinner);

        if (!url) {
            console.warn("⚠️ Empty URL provided");
            displayError('يرجى إدخال رابط موقع الويب.');
            return;
        }

        // التحقق من صحة URL
        let validUrl;
        try {
            validUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
            console.log("✅ Valid URL created:", validUrl.href);
        } catch (error) {
            console.error("❌ Invalid URL format:", error);
            displayError('يرجى إدخال رابط صحيح للموقع.');
            return;
        }

        try {
            const backendApiUrl = `${window.location.origin}/analyze`;
            console.log("🚀 Sending POST request to:", backendApiUrl);
            console.log("📦 Request payload:", { url: validUrl.href });
            
            const requestStartTime = performance.now();
            
            const response = await fetch(backendApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url: validUrl.href }),
            });

            const requestEndTime = performance.now();
            console.log(`⏱️ Request completed in ${Math.round(requestEndTime - requestStartTime)}ms`);
            console.log("📡 Response received. Status:", response.status);
            console.log("📋 Response headers:", Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                console.error("❌ Response not OK. Status:", response.status);
                const errorText = await response.text();
                console.error("📄 Raw error response:", errorText);
                
                let errorMessage = 'حدث خطأ في الخادم';
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.error || errorMessage;
                    console.log("📝 Parsed error data:", errorData);
                } catch (jsonError) {
                    console.error("❌ Could not parse error as JSON:", jsonError);
                    errorMessage = `خطأ من الخادم: ${errorText.substring(0, 100)}${errorText.length > 100 ? '...' : ''}`;
                }
                
                throw new Error(errorMessage);
            }

            const results = await response.json();
            console.log("✅ Successfully received results:", results);
            console.log("📊 Results structure check:");
            console.log("  - seo_score:", results.seo_score);
            console.log("  - performance_score:", results.performance_score);
            console.log("  - accessibility_score:", results.accessibility_score);
            console.log("  - title:", results.title);

            // حفظ النتائج للاستخدام في تصدير PDF
            window.lastAnalysisResults = results;
            console.log("💾 Results saved to window.lastAnalysisResults");

            hideElement(loadingSpinner);
            displayResults(validUrl.href, results);

        } catch (error) {
            console.error('❌ ANALYSIS FAILED:', error);
            console.error('❌ Error stack:', error.stack);
            displayError(`فشل التحليل: ${error.message}. يرجى المحاولة مرة أخرى.`);
        }
    });

    // معالج حدث زر "تحليل موقع آخر"
    if (analyzeAnotherButton) {
        analyzeAnotherButton.addEventListener('click', () => {
            console.log("🔄 Analyze another button clicked");
            hideElement(resultsDashboard);
            hideElement(errorMessage);
            websiteUrlInput.value = '';
            
            const inputSection = document.getElementById('input-section');
            if (inputSection) {
                showElement(inputSection);
            }
        });
    }

    // معالج حدث زر تصدير PDF
    if (exportPdfButton) {
        exportPdfButton.addEventListener('click', async () => {
            console.log("📄 Export PDF button clicked");
            
            const currentUrl = analyzedUrlSpan ? analyzedUrlSpan.textContent : '';
            if (!currentUrl || !window.lastAnalysisResults) {
                console.warn("⚠️ No analysis results available for PDF export");
                displayError('لا توجد نتائج تحليل للتصدير. يرجى إجراء تحليل أولاً.');
                return;
            }

            exportPdfButton.textContent = 'جاري إنشاء PDF...';
            exportPdfButton.disabled = true;
            console.log("📊 Starting PDF generation for:", currentUrl);

            try {
                const backendReportUrl = `${window.location.origin}/generate_report`;
                console.log("🚀 Sending PDF generation request to:", backendReportUrl);
                
                const response = await fetch(backendReportUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        url: currentUrl, 
                        results: window.lastAnalysisResults 
                    }),
                });

                console.log("📡 PDF response status:", response.status);

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error("❌ PDF generation failed:", errorData);
                    throw new Error(errorData.error || 'فشل في إنشاء تقرير PDF.');
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
                
                console.log("✅ PDF download initiated successfully");

            } catch (error) {
                console.error('❌ PDF export failed:', error);
                displayError(`فشل تصدير PDF: ${error.message}`);
            } finally {
                exportPdfButton.textContent = 'تصدير تقرير PDF';
                exportPdfButton.disabled = false;
            }
        });
    }

    // تبديل الوضع الداكن/الفاتح
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            console.log("🎨 Theme toggle clicked");
            document.body.classList.toggle('dark');
            const isDark = document.body.classList.contains('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            console.log("💡 Theme changed to:", isDark ? 'dark' : 'light');
        });
    }

    // تحميل تفضيل الوضع عند التحميل
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
        console.log("🌙 Dark theme loaded from localStorage");
    } else {
        console.log("☀️ Light theme active");
    }

    console.log("=== INITIALIZATION COMPLETE ===");
    console.log("🎉 App ready for use!");
});
