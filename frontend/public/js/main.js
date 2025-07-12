const API_BASE_URL = 'https://seo-analyser-tools.onrender.com'; // Replace with your actual Render app URL

const websiteUrlInput = document.getElementById('website-url');
const analyzeButton = document.getElementById('analyze-button');
const errorMessage = document.getElementById('error-message');
const loadingSpinner = document.getElementById('loading-spinner');
const resultsDashboard = document.getElementById('results-dashboard');

const analyzedUrlSpan = document.getElementById('analyzed-url');
const domainAuthorityScoreDiv = document.getElementById('domain-authority-score');
const domainAuthorityProgress = document.getElementById('domain-authority-progress');
const domainAuthorityText = document.getElementById('domain-authority-text');
const performanceScoreDiv = document.getElementById('performance-score');
const performanceProgress = document.getElementById('performance-progress');
const performanceText = document.getElementById('performance-text');
const seoOverallScoreDiv = document.getElementById('seo-overall-score');
const seoOverallProgress = document.getElementById('seo-overall-progress');
const seoOverallText = document.getElementById('seo-overall-text');

// AI Summary
const aiSummarySection = document.getElementById('ai-summary-section');
const aiSummaryText = document.getElementById('ai-summary-text');

// Domain Authority
const domainNameSpan = document.getElementById('domain-name');
const domainAuthorityEstimateSpan = document.getElementById('domain-authority-estimate');
const domainAgeSpan = document.getElementById('domain-age');
const sslStatusSpan = document.getElementById('ssl-status');
const blacklistStatusSpan = document.getElementById('blacklist-status');
const dnsHealthSpan = document.getElementById('dns-health');

// Page Speed
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


// User Experience (UX)
const uxIssuesList = document.getElementById('ux-issues-list');
const uxSuggestionsList = document.getElementById('ux-suggestions-list');
const aiContentInsightsSection = document.getElementById('ai-content-insights-section');
const aiContentInsightsText = document.getElementById('ai-content-insights-text');


// Action Buttons
const analyzeAnotherButton = document.getElementById('analyze-another-button');
const exportPdfButton = document.getElementById('export-pdf-button'); // This button is now in the main results section

let currentAnalysisResults = null; // Store results for PDF export

// --- Theme Toggle ---
const themeToggle = document.getElementById('theme-toggle');
const htmlElement = document.documentElement;

themeToggle.addEventListener('click', () => {
    htmlElement.classList.toggle('dark');
    // Store user preference in localStorage
    if (htmlElement.classList.contains('dark')) {
        localStorage.setItem('theme', 'dark');
    } else {
        localStorage.setItem('theme', 'light');
    }
});

// Apply saved theme on load
if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    htmlElement.classList.add('dark');
} else {
    htmlElement.classList.remove('dark');
}


// --- Helper Functions ---
function showElement(element) {
    element.classList.remove('hidden');
}

function hideElement(element) {
    element.classList.add('hidden');
}

// Function to update score circle and progress bar
function updateScoreDisplay(scoreDiv, progressBar, scoreTextEl, score, category) {
    scoreDiv.textContent = score !== null && score !== undefined ? `${Math.round(score)}` : 'N/A';
    let progressWidth = score !== null && score !== undefined ? Math.min(100, Math.max(0, score)) : 0;
    progressBar.style.width = `${progressWidth}%`;

    // Remove previous classes
    progressBar.classList.remove('progress-good', 'progress-medium', 'progress-bad');

    let statusText = "Calculating...";
    if (score !== null && score !== undefined) {
        if (score >= 90) {
            progressBar.classList.add('progress-good');
            statusText = "Excellent score!";
        } else if (score >= 70) {
            progressBar.classList.add('progress-good');
            statusText = "Good score!";
        } else if (score >= 50) {
            progressBar.classList.add('progress-medium');
            statusText = "Average score, needs improvement.";
        } else {
            progressBar.classList.add('progress-bad');
            statusText = "Poor score, critical improvement needed.";
        }
    }

    if (scoreTextEl) {
        if (category === 'Domain Authority') {
            if (score >= 70) statusText = "Excellent trust score.";
            else if (score >= 40) statusText = "Good trust score.";
            else statusText = "Low trust score, needs attention.";
        } else if (category === 'Performance') {
            if (score >= 90) statusText = "Outstanding speed.";
            else if (score >= 70) statusText = "Good speed.";
            else if (score >= 50) statusText = "Average speed, consider optimizations.";
            else statusText = "Slow speed, critical optimization needed.";
        } else if (category === 'SEO Score') {
            if (score >= 90) statusText = "Excellent SEO optimization.";
            else if (score >= 70) statusText = "Good SEO optimization.";
            else if (score >= 50) statusText = "Average SEO, needs focus.";
            else statusText = "Poor SEO, critical issues detected.";
        }
        scoreTextEl.textContent = statusText;
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
    // Clear all texts and lists
    analyzedUrlSpan.textContent = '';
    updateScoreDisplay(domainAuthorityScoreDiv, domainAuthorityProgress, domainAuthorityText, null, 'Domain Authority');
    updateScoreDisplay(performanceScoreDiv, performanceProgress, performanceText, null, 'Performance');
    updateScoreDisplay(seoOverallScoreDiv, seoOverallProgress, seoOverallText, null, 'SEO Score');

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


// --- Main Analysis Logic ---
analyzeButton.addEventListener('click', async () => {
    const url = websiteUrlInput.value.trim();
    if (!isValidUrl(url)) {
        errorMessage.textContent = "Please enter a valid URL (e.g., https://example.com).";
        showElement(errorMessage);
        hideElement(resultsDashboard);
        return;
    }

    errorMessage.classList.add('hidden');
    hideElement(resultsDashboard);
    showElement(loadingSpinner);
    currentAnalysisResults = null; // Clear previous results

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
            throw new Error(errorData.error || 'An error occurred during analysis.');
        }

        const data = await response.json();
        currentAnalysisResults = data; // Store results
        displayResults(url, data);

    } catch (error) {
        errorMessage.textContent = `Analysis failed: ${error.message}`;
        showElement(errorMessage);
        console.error('Analysis error:', error);
    } finally {
        hideElement(loadingSpinner);
    }
});

function displayResults(url, results) {
    analyzedUrlSpan.textContent = url;
    showElement(resultsDashboard);

    // Overall Scores - Using new updateScoreDisplay function
    // For Domain Authority, we'll use a placeholder score as it's hard to get real DA for free.
    // Let's map domain age to a score for demonstration.
    let domainAgeScore = 0;
    if (results.domain_authority?.domain_age_years !== 'N/A') {
        const age = parseInt(results.domain_authority.domain_age_years);
        if (age >= 10) domainAgeScore = 95;
        else if (age >= 5) domainAgeScore = 80;
        else if (age >= 2) domainAgeScore = 60;
        else domainAgeScore = 30;
    }
    updateScoreDisplay(domainAuthorityScoreDiv, domainAuthorityProgress, domainAuthorityText, domainAgeScore, 'Domain Authority');

    updateScoreDisplay(performanceScoreDiv, performanceProgress, performanceText, results.page_speed?.scores?.['Performance Score'], 'Performance');
    updateScoreDisplay(seoOverallScoreDiv, seoOverallProgress, seoOverallText, results.seo_quality?.score, 'SEO Score');

    // AI Summary
    if (results.ai_insights?.summary) {
        showElement(aiSummarySection);
        aiSummaryText.textContent = results.ai_insights.summary;
    } else {
        hideElement(aiSummarySection);
    }

    // Domain Authority & Trust
    const domainData = results.domain_authority || {};
    domainNameSpan.textContent = domainData.domain || 'N/A';
    domainAuthorityEstimateSpan.textContent = domainData.domain_authority_estimate || 'N/A';
    domainAgeSpan.textContent = domainData.domain_age_years !== undefined ? `${domainData.domain_age_years} years` : 'N/A';
    sslStatusSpan.textContent = domainData.ssl_status || 'N/A';
    blacklistStatusSpan.textContent = domainData.blacklist_status || 'N/A';
    dnsHealthSpan.textContent = domainData.dns_health || 'N/A';

    // Page Speed & Performance
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
            li.textContent = `${issue.title} ${issue.score !== undefined ? `(Score: ${Math.round(issue.score)})` : ''}: ${issue.description || ''}`;
            if (issue.images && issue.images.length > 0) {
                li.textContent += ` Images: ${issue.images.join(', ')}`;
            }
            performanceIssuesList.appendChild(li);
        });
    } else {
        const li = document.createElement('li');
        li.textContent = 'No major performance issues detected.';
        li.classList.add('text-green-600', 'dark:text-green-400');
        performanceIssuesList.appendChild(li);
    }
    pagespeedLink.href = pageSpeedData.full_report_link || '#';

    // SEO Quality & Structure
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
        li.textContent = 'No critical SEO issues detected based on our analysis.';
        seoImprovementTipsList.appendChild(li);
    }

    if (results.ai_insights?.seo_improvement_suggestions) {
        showElement(aiSeoSuggestionsSection);
        aiSeoSuggestionsText.textContent = results.ai_insights.seo_improvement_suggestions;
    } else {
        hideElement(aiSeoSuggestionsSection);
    }

    // User Experience (UX)
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
        li.textContent = 'No major UX issues detected based on our heuristic analysis.';
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


// --- Action Button Handlers ---
analyzeAnotherButton.addEventListener('click', () => {
    clearResults();
    // Scroll to top or input section
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

exportPdfButton.addEventListener('click', async () => {
    if (!currentAnalysisResults) {
        alert("Please analyze a website first to generate a report.");
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
            throw new Error(errorData.error || 'Failed to generate PDF report.');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        // Create a suitable filename
        const filename = `${websiteUrlInput.value.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\//g, '_')}_analysis_report.pdf`;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        alert(`Error generating PDF: ${error.message}`);
        console.error('Error generating PDF:', error);
    }
});
