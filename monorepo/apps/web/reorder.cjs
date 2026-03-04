const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/admin/AddProduct.tsx');
const file = fs.readFileSync(filePath, 'utf8');

const extractBlock = (startStr, endStr) => {
    const startIdx = file.indexOf(startStr);
    if (startIdx === -1) throw new Error('Cannot find ' + startStr);
    const endIdx = file.indexOf(endStr, startIdx);
    if (endIdx === -1) throw new Error('Cannot find ' + endStr);
    return file.substring(startIdx, endIdx);
};

// blocks
const ai = extractBlock('{/* AI Quick Input (new products only) */}', '{/* Basic Info */}');
const basicInfo = extractBlock('{/* Basic Info */}', '{/* Media Gallery */}');
const media = extractBlock('{/* Media Gallery */}', '{/* Specifications */}');
const specs = extractBlock('{/* Specifications */}', '{/* Hardware Props (Conditional) */}');
const hwProps = extractBlock('{/* Hardware Props (Conditional) */}', '</div>\n\n                {/* ===== SIDEBAR COLUMN');
const statusPublish = extractBlock('{/* Status & Publish */}', '{/* Organization */}');
const organization = extractBlock('{/* Organization */}', '{/* Pricing */}');
const pricing = extractBlock('{/* Pricing */}', '{/* Inventory */}');
const inventory = extractBlock('{/* Inventory */}', '{/* SEO */}');
const seo = extractBlock('{/* SEO */}', '</div>\n            </div>\n\n            {/* Helper Styles */}');

const prefixIdx = file.indexOf('{/* Main Content Grid */}');
const suffixIdx = file.indexOf('{/* Helper Styles */}');

const prefix = file.substring(0, prefixIdx);
const suffix = file.substring(suffixIdx);

const newContent = prefix +
    `{/* Main Content Grid */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="container mx-auto max-w-7xl flex flex-col gap-6 pb-20">
                    
                    {/* ===== TOP SECTION ====== */}
                    <div className="w-full flex flex-col gap-6">\n` +
    ai + basicInfo +
    `                    </div>

                    {/* ===== MAIN TWO WRAPPERS ====== */}
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                        {/* RIGHT COLUMN (RTL -> first visually) */}
                        <div className="xl:col-span-4 flex flex-col gap-6">\n` +
    statusPublish + pricing + inventory + organization +
    `                        </div>

                        {/* LEFT COLUMN */}
                        <div className="xl:col-span-8 flex flex-col gap-6">\n` +
    media + specs + hwProps + seo +
    `                        </div>
                    </div>
                </div>
            </div>\n\n            ` + suffix;

fs.writeFileSync(filePath, newContent);
console.log('Reordered successfully!');
