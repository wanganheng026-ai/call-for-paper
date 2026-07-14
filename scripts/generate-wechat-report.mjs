import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

async function loadJson(filePath) {
    const data = await fs.readFile(path.join(ROOT, filePath), 'utf8');
    return JSON.parse(data);
}

function formatDate(dateStr) {
    if (!dateStr) return '待定';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toISOString().split('T')[0];
}

function getFullPaperDeadline(call) {
    if (!call.dates || !Array.isArray(call.dates)) return '待定';
    const deadline = call.dates.find(d => d.is_full_paper_submission_deadline);
    return deadline ? formatDate(deadline.date) : '待定';
}

async function main() {
    const calls = await loadJson('www/_data/calls.json');
    
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // 只取本周新增的 active CFP
    const newCalls = calls.filter(call => {
        if (!call.active) return false;
        const pubDate = new Date(call.pubDate);
        return pubDate >= oneWeekAgo;
    });
    
    // 按评级排序
    const ratingOrder = { '🟢🟢🟢': 4, '🟢🟢': 3, '🟢': 2, '🟡': 1, '🔴': 0 };
    newCalls.sort((a, b) => {
        const ra = ratingOrder[a.topic_fits] || 0;
        const rb = ratingOrder[b.topic_fits] || 0;
        return rb - ra;
    });
    
    let report = '';
    
    if (newCalls.length === 0) {
        report = '📭 本周无新 CFP\n\n上周监控的 49 个期刊中，没有新增 Special Issue。';
    } else {
        report = `📬 本周新增 ${newCalls.length} 个 CFP\n\n`;
        
        for (const call of newCalls) {
            const rating = call.topic_fits || '🟡';
            const title = call.title || call.metaTitle || '无标题';
            const journal = call.journal || '未知期刊';
            const deadline = getFullPaperDeadline(call);
            const url = call.url || '';
            const analysis = call.analysis || '';
            
            report += `${rating} **${journal}**\n`;
            report += `📌 ${title}\n`;
            report += `⏰ Deadline: ${deadline}\n`;
            if (url) report += `🔗 ${url}\n`;
            if (analysis) {
                const shortAnalysis = analysis.slice(0, 100);
                report += `💡 ${shortAnalysis}${analysis.length > 100 ? '...' : ''}\n`;
            }
            report += `\n---\n\n`;
        }
    }
    
    // 添加汇总
    const activeCalls = calls.filter(c => c.active);
    report += `\n📊 当前活跃 CFP 总数: ${activeCalls.length}\n`;
    report += `🗓️ 报告时间: ${now.toISOString().split('T')[0]}\n`;
    
    // 保存
    const outputDir = path.join(ROOT, 'output');
    await fs.mkdir(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, 'wechat_report.md');
    await fs.writeFile(outputPath, report, 'utf8');
    
    console.log(`✅ WeChat report generated: ${outputPath}`);
    console.log(`📋 New CFPs this week: ${newCalls.length}`);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
