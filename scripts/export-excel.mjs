import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

async function loadJson(filePath) {
    const data = await fs.readFile(path.join(ROOT, filePath), 'utf8');
    return JSON.parse(data);
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toISOString().split('T')[0];
}

function getFullPaperDeadline(call) {
    if (!call.dates || !Array.isArray(call.dates)) return '';
    const deadline = call.dates.find(d => d.is_full_paper_submission_deadline);
    return deadline ? formatDate(deadline.date) : '';
}

function getEditors(call) {
    if (!call.editors || !Array.isArray(call.editors)) return '';
    return call.editors.map(e => `${e.name}${e.affiliation ? ` (${e.affiliation})` : ''}`).join('; ');
}

async function main() {
    const calls = await loadJson('www/_data/calls.json');
    const journals = await loadJson('www/_data/journals.json');
    const profile = await loadJson('www/_data/research_profile.json');

    const journalMap = new Map(journals.map(j => [j.title, j]));

    const rows = calls.map(call => {
        const journal = journalMap.get(call.journal) || {};
        return {
            'Publisher': journal.publisher || '',
            'Field': journal.field || '',
            'Journal Title': call.journal || '',
            'AJG 2024': journal.ajg || '',
            'topic fits': call.topic_fits || '',
            'special issue name': call.title || call.metaTitle || '',
            'Deadline': getFullPaperDeadline(call),
            'Guest Editors': getEditors(call),
            'Link': call.url || '',
            'tags': (call.tags || []).join(', '),
            'analysis': call.analysis || '',
            'Active': call.active ? 'Yes' : 'No',
        };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Set column widths
    const colWidths = [
        { wch: 18 }, // Publisher
        { wch: 12 }, // Field
        { wch: 45 }, // Journal Title
        { wch: 10 }, // AJG
        { wch: 12 }, // topic fits
        { wch: 60 }, // special issue name
        { wch: 14 }, // Deadline
        { wch: 50 }, // Guest Editors
        { wch: 60 }, // Link
        { wch: 40 }, // tags
        { wch: 80 }, // analysis
        { wch: 10 }, // Active
    ];
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Special Issues');

    const outputDir = path.join(ROOT, 'output');
    await fs.mkdir(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, `special_issues_report_${new Date().toISOString().split('T')[0]}.xlsx`);
    XLSX.writeFile(workbook, outputPath);

    console.log(`Excel report exported to: ${outputPath}`);
    console.log(`Total rows: ${rows.length}`);
}

main().catch(err => {
    console.error('Export failed:', err);
    process.exit(1);
});
