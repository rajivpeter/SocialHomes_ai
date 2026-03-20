#!/usr/bin/env python3
"""
Generate infographic-quality charts for the SocialHomes.Ai business plan
using HTML/CSS rendered to PNG via html2image (Chrome headless).
"""

import os
from html2image import Html2Image

CHART_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'charts')
os.makedirs(CHART_DIR, exist_ok=True)

hti = Html2Image(
    output_path=CHART_DIR,
    custom_flags=['--no-sandbox', '--disable-gpu', '--disable-software-rasterizer',
                  '--force-device-scale-factor=2']
)

# Brand colours
TEAL = '#00AAA4'
DARK_TEAL = '#005f5c'
DARK = '#1a1a2e'
BG = 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)'
CARD_SHADOW = '0 4px 20px rgba(0,0,0,0.08)'

BASE_STYLE = '''
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; }
.container { padding: 40px 48px; background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%); }
h2 { color: #1a1a2e; font-size: 26px; margin-bottom: 6px; }
.subtitle { color: #666; font-size: 14px; margin-bottom: 28px; }
'''

def render(html, filename, width=1200, height=600):
    full_html = f'<html><head><style>{BASE_STYLE}</style></head><body>{html}</body></html>'
    hti.screenshot(html_str=full_html, save_as=filename, size=(width, height))
    print(f'  Created: {filename}')


# ═══════════════════════════════════════════════════════════════
# 1. MARKET SEGMENTATION — Donut with info cards
# ═══════════════════════════════════════════════════════════════

def chart_market_segmentation():
    html = '''
    <div class="container" style="display:flex; gap:40px; align-items:flex-start;">
      <div style="flex:1;">
        <h2>UK Housing Providers by Stock Size</h2>
        <p class="subtitle">Market Entry Strategy — RSH 2024-25 Data</p>
        <!-- SVG Donut Chart -->
        <svg viewBox="0 0 400 400" width="360" height="360" style="margin-left:20px;">
          <!-- Background circle -->
          <circle cx="200" cy="200" r="150" fill="none" stroke="#ddd" stroke-width="60"/>
          <!-- 78% segment (< 1,000 homes) -->
          <circle cx="200" cy="200" r="150" fill="none" stroke="#b0c4c4" stroke-width="60"
                  stroke-dasharray="733 210" stroke-dashoffset="0" transform="rotate(-90 200 200)"/>
          <!-- 13% segment (1,000-5,000) — our target -->
          <circle cx="200" cy="200" r="150" fill="none" stroke="#00AAA4" stroke-width="64"
                  stroke-dasharray="122.5 820.5" stroke-dashoffset="-733" transform="rotate(-90 200 200)"/>
          <!-- 4% segment -->
          <circle cx="200" cy="200" r="150" fill="none" stroke="#7dd3d0" stroke-width="60"
                  stroke-dasharray="37.7 905.3" stroke-dashoffset="-855.5" transform="rotate(-90 200 200)"/>
          <!-- 3% segment -->
          <circle cx="200" cy="200" r="150" fill="none" stroke="#808080" stroke-width="60"
                  stroke-dasharray="28.3 914.7" stroke-dashoffset="-893.2" transform="rotate(-90 200 200)"/>
          <!-- 1% segment -->
          <circle cx="200" cy="200" r="150" fill="none" stroke="#005f5c" stroke-width="60"
                  stroke-dasharray="9.4 933.6" stroke-dashoffset="-921.5" transform="rotate(-90 200 200)"/>
          <!-- Center text -->
          <text x="200" y="190" text-anchor="middle" font-size="36" font-weight="700" fill="#1a1a2e">1,581</text>
          <text x="200" y="218" text-anchor="middle" font-size="14" fill="#666">providers</text>
          <text x="200" y="236" text-anchor="middle" font-size="14" fill="#666">4.5M homes</text>
        </svg>
      </div>
      <div style="flex:1; display:flex; flex-direction:column; gap:14px; padding-top:60px;">
        <!-- Card 1 -->
        <div style="background:white; border-radius:12px; padding:16px 20px; box-shadow:0 2px 12px rgba(0,0,0,0.06); border-left:5px solid #b0c4c4;">
          <div style="font-size:22px; font-weight:700; color:#1a1a2e;">78%</div>
          <div style="font-size:13px; color:#666;">< 1,000 homes — 1,126 providers</div>
          <div style="font-size:11px; color:#999; margin-top:2px;">Too small for full HMS</div>
        </div>
        <!-- Card 2 — TARGET -->
        <div style="background:linear-gradient(135deg, #00AAA4, #008f8a); border-radius:12px; padding:16px 20px; box-shadow:0 2px 12px rgba(0,170,164,0.3);">
          <div style="font-size:22px; font-weight:700; color:white;">13% — PRIMARY TARGET</div>
          <div style="font-size:13px; color:rgba(255,255,255,0.9);">1,000–5,000 homes — ~180 providers</div>
          <div style="font-size:11px; color:rgba(255,255,255,0.7); margin-top:2px;">Years 1-2: Establish with consortium</div>
        </div>
        <!-- Card 3 -->
        <div style="background:white; border-radius:12px; padding:16px 20px; box-shadow:0 2px 12px rgba(0,0,0,0.06); border-left:5px solid #7dd3d0;">
          <div style="font-size:22px; font-weight:700; color:#1a1a2e;">4%</div>
          <div style="font-size:13px; color:#666;">5,000–15,000 homes — ~60 providers</div>
          <div style="font-size:11px; color:#999; margin-top:2px;">Years 3-4: Mid-market entry</div>
        </div>
        <!-- Card 4 -->
        <div style="background:white; border-radius:12px; padding:16px 20px; box-shadow:0 2px 12px rgba(0,0,0,0.06); border-left:5px solid #808080;">
          <div style="font-size:22px; font-weight:700; color:#1a1a2e;">3% + 1%</div>
          <div style="font-size:13px; color:#666;">15,000–125,000 homes — ~70 providers</div>
          <div style="font-size:11px; color:#999; margin-top:2px;">Years 5-10: Enterprise + G15</div>
        </div>
      </div>
    </div>
    <div style="text-align:center; padding:8px; color:#999; font-size:11px; background:#f5f7fa;">
      Source: RSH Statistical Data Return 2024-25. Total: 1,581 providers managing 4.5M homes.
    </div>
    '''
    render(html, 'info_market_segmentation.png', 1200, 620)


# ═══════════════════════════════════════════════════════════════
# 2. ARR HOCKEY STICK — with valuation milestones
# ═══════════════════════════════════════════════════════════════

def chart_arr_growth():
    arr = [200, 415, 1140, 2920, 6040, 12500, 15800, 21440, 26800, 32440]
    max_arr = max(arr)
    years = ['Y1', 'Y2', 'Y3', 'Y4', 'Y5', 'Y6', 'Y7', 'Y8', 'Y9', 'Y10']
    valuations = ['£1.6M', '£3.3M', '£9.1M', '£23M', '£48M', '£100M', '£126M', '£172M', '£214M', '£260M']

    bars_html = ''
    for i, (y, a, v) in enumerate(zip(years, arr, valuations)):
        h = max(a / max_arr * 320, 8)
        color = TEAL if a < 5000 else '#008080' if a < 12000 else DARK_TEAL
        label = f'£{a/1000:.1f}M' if a >= 1000 else f'£{a}k'
        val_badge = ''
        if i in [2, 5, 9]:  # Y3, Y6, Y10 milestones
            badge_bg = '#ff6b35' if i == 5 else '#005f5c'
            val_badge = f'<div style="background:{badge_bg}; color:white; padding:3px 8px; border-radius:20px; font-size:10px; font-weight:700; margin-bottom:4px; white-space:nowrap;">{v}</div>'
        bars_html += f'''
        <div style="display:flex; flex-direction:column; align-items:center; flex:1;">
          {val_badge}
          <div style="font-size:11px; font-weight:700; color:{color}; margin-bottom:4px;">{label}</div>
          <div style="width:44px; height:{h}px; background:linear-gradient(180deg, {color}, {color}dd); border-radius:6px 6px 0 0;"></div>
          <div style="font-size:12px; color:#666; margin-top:6px; font-weight:600;">{y}</div>
        </div>'''

    html = f'''
    <div class="container">
      <h2>Annual Recurring Revenue — 10-Year Growth</h2>
      <p class="subtitle">£200k to £32.4M ARR — hockey stick growth as we enter mid-market and enterprise segments</p>
      <div style="background:white; border-radius:16px; padding:30px; box-shadow:{CARD_SHADOW};">
        <div style="display:flex; align-items:flex-end; gap:8px; height:380px; padding-bottom:10px;">
          {bars_html}
        </div>
      </div>
      <div style="display:flex; justify-content:center; gap:30px; margin-top:20px;">
        <div style="background:white; border-radius:10px; padding:12px 24px; box-shadow:0 2px 8px rgba(0,0,0,0.06); text-align:center;">
          <div style="font-size:11px; color:#999;">Year 6 Valuation</div>
          <div style="font-size:24px; font-weight:800; color:#ff6b35;">£100M</div>
          <div style="font-size:10px; color:#666;">at 8× ARR</div>
        </div>
        <div style="background:white; border-radius:10px; padding:12px 24px; box-shadow:0 2px 8px rgba(0,0,0,0.06); text-align:center;">
          <div style="font-size:11px; color:#999;">Year 10 Valuation</div>
          <div style="font-size:24px; font-weight:800; color:{DARK_TEAL};">£260M</div>
          <div style="font-size:10px; color:#666;">at 8× ARR</div>
        </div>
        <div style="background:white; border-radius:10px; padding:12px 24px; box-shadow:0 2px 8px rgba(0,0,0,0.06); text-align:center;">
          <div style="font-size:11px; color:#999;">Return on £480k</div>
          <div style="font-size:24px; font-weight:800; color:{TEAL};">540×</div>
          <div style="font-size:10px; color:#666;">by Year 10</div>
        </div>
      </div>
    </div>
    '''
    render(html, 'info_arr_growth.png', 1200, 600)


# ═══════════════════════════════════════════════════════════════
# 3. CUSTOMER GROWTH — Stacked visual with segment colors
# ═══════════════════════════════════════════════════════════════

def chart_customer_growth():
    small =      [10, 15, 22, 30, 38, 45, 50, 55, 58, 60]
    mid =        [0,  0,  5, 14, 26, 40, 55, 68, 78, 88]
    large =      [0,  0,  0,  4, 10, 18, 26, 34, 42, 50]
    enterprise = [0,  0,  0,  0,  3,  7, 12, 18, 24, 30]
    g15 =        [0,  0,  0,  0,  0,  2,  4,  7, 10, 14]
    totals =     [10, 15, 27, 48, 77, 112, 147, 182, 212, 242]
    years = ['Y1', 'Y2', 'Y3', 'Y4', 'Y5', 'Y6', 'Y7', 'Y8', 'Y9', 'Y10']
    max_t = max(totals)

    bars_html = ''
    for i in range(10):
        segs = [
            (small[i], '#7dd3d0'),
            (mid[i], '#00AAA4'),
            (large[i], '#008080'),
            (enterprise[i], '#005f5c'),
            (g15[i], '#003d3a'),
        ]
        segments = ''
        for count, color in segs:
            if count > 0:
                h = count / max_t * 300
                segments += f'<div style="width:100%; height:{h}px; background:{color};"></div>'
        bars_html += f'''
        <div style="display:flex; flex-direction:column; align-items:center; flex:1;">
          <div style="font-size:12px; font-weight:700; color:#1a1a2e; margin-bottom:4px;">{totals[i]}</div>
          <div style="width:48px; display:flex; flex-direction:column-reverse; border-radius:6px 6px 0 0; overflow:hidden;">
            {segments}
          </div>
          <div style="font-size:12px; color:#666; margin-top:6px; font-weight:600;">{years[i]}</div>
        </div>'''

    html = f'''
    <div class="container">
      <h2>Customer Growth by Segment — 10-Year Projection</h2>
      <p class="subtitle">From 10 consortium members to 242 customers across all segments</p>
      <div style="background:white; border-radius:16px; padding:30px; box-shadow:{CARD_SHADOW};">
        <div style="display:flex; align-items:flex-end; gap:10px; height:370px; padding-bottom:10px;">
          {bars_html}
        </div>
      </div>
      <div style="display:flex; justify-content:center; gap:20px; margin-top:18px; flex-wrap:wrap;">
        <div style="display:flex; align-items:center; gap:6px;"><div style="width:14px; height:14px; border-radius:3px; background:#7dd3d0;"></div><span style="font-size:12px; color:#555;">Small (1-5k homes)</span></div>
        <div style="display:flex; align-items:center; gap:6px;"><div style="width:14px; height:14px; border-radius:3px; background:#00AAA4;"></div><span style="font-size:12px; color:#555;">Mid-market (5-15k)</span></div>
        <div style="display:flex; align-items:center; gap:6px;"><div style="width:14px; height:14px; border-radius:3px; background:#008080;"></div><span style="font-size:12px; color:#555;">Large (15-30k)</span></div>
        <div style="display:flex; align-items:center; gap:6px;"><div style="width:14px; height:14px; border-radius:3px; background:#005f5c;"></div><span style="font-size:12px; color:#555;">Enterprise (30-50k)</span></div>
        <div style="display:flex; align-items:center; gap:6px;"><div style="width:14px; height:14px; border-radius:3px; background:#003d3a;"></div><span style="font-size:12px; color:#555;">G15/Mega (50k+)</span></div>
      </div>
    </div>
    '''
    render(html, 'info_customer_growth.png', 1200, 560)


# ═══════════════════════════════════════════════════════════════
# 4. PRICING COMPARISON — Small HA segment
# ═══════════════════════════════════════════════════════════════

def chart_pricing_comparison():
    vendors = [
        ('Civica Cx', 66, '#808080'),
        ('ActiveH / Aareon', 60, '#808080'),
        ('NEC Housing', 55, '#808080'),
        ('MRI / Orchard', 45, '#808080'),
        ('OmniLedger Pyramid', 28, '#b0b0b0'),
        ('SocialHomes.Ai', 20, '#00AAA4'),
    ]
    max_cost = 75

    rows = ''
    for name, cost, color in vendors:
        w = cost / max_cost * 100
        highlight = 'border-left:5px solid #00AAA4; background:#f0fafa;' if 'Social' in name else 'border-left:5px solid #e0e0e0;'
        badge = '<span style="background:#00AAA4; color:white; padding:2px 8px; border-radius:10px; font-size:10px; margin-left:8px;">50-70% SAVING</span>' if 'Social' in name else ''
        rows += f'''
        <div style="padding:14px 20px; {highlight} margin-bottom:8px; border-radius:0 8px 8px 0;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <span style="font-size:14px; font-weight:{'700' if 'Social' in name else '500'}; color:#1a1a2e;">{name}{badge}</span>
            <span style="font-size:16px; font-weight:700; color:{'#00AAA4' if 'Social' in name else '#555'};">£{cost}k/yr</span>
          </div>
          <div style="height:10px; background:#eee; border-radius:5px; overflow:hidden;">
            <div style="height:100%; width:{w}%; background:linear-gradient(90deg, {color}, {color}cc); border-radius:5px;"></div>
          </div>
        </div>'''

    html = f'''
    <div class="container">
      <h2>Annual HMS Cost Comparison</h2>
      <p class="subtitle">For a housing association managing ~2,500 homes (based on G-Cloud Digital Marketplace and tender data)</p>
      <div style="background:white; border-radius:16px; padding:24px; box-shadow:{CARD_SHADOW};">
        {rows}
      </div>
      <div style="text-align:center; margin-top:12px; color:#999; font-size:11px;">
        Sources: G-Cloud Digital Marketplace (ActiveH £24/unit/yr, Civica £5,527/licence/mo), Find a Tender 2024-25
      </div>
    </div>
    '''
    render(html, 'info_pricing_comparison.png', 1000, 580)


# ═══════════════════════════════════════════════════════════════
# 5. TAM / SAM / SOM — Clean version
# ═══════════════════════════════════════════════════════════════

def chart_tam_sam_som():
    html = f'''
    <div class="container" style="display:flex; gap:40px; align-items:center;">
      <div style="flex:1; display:flex; justify-content:center;">
        <svg viewBox="0 0 440 440" width="400" height="400">
          <!-- TAM -->
          <circle cx="220" cy="220" r="200" fill="#e0e0e0" opacity="0.5"/>
          <text x="220" y="60" text-anchor="middle" font-size="16" font-weight="700" fill="#666">TAM</text>
          <!-- SAM -->
          <circle cx="220" cy="240" r="140" fill="#7dd3d0" opacity="0.6"/>
          <text x="220" y="130" text-anchor="middle" font-size="15" font-weight="700" fill="#555">SAM</text>
          <!-- SOM -->
          <circle cx="220" cy="260" r="70" fill="{TEAL}" opacity="0.85"/>
          <text x="220" y="250" text-anchor="middle" font-size="18" font-weight="800" fill="white">SOM</text>
          <text x="220" y="272" text-anchor="middle" font-size="12" fill="rgba(255,255,255,0.9)">Year 3</text>
        </svg>
      </div>
      <div style="flex:1; display:flex; flex-direction:column; gap:16px;">
        <div style="background:white; border-radius:12px; padding:20px; box-shadow:0 2px 10px rgba(0,0,0,0.06); border-left:5px solid #ccc;">
          <div style="font-size:12px; color:#999; text-transform:uppercase; letter-spacing:1px;">Total Addressable Market</div>
          <div style="font-size:28px; font-weight:800; color:#1a1a2e;">~1,500 orgs</div>
          <div style="font-size:14px; color:#666;">£150M–£250M per year</div>
          <div style="font-size:12px; color:#999; margin-top:4px;">All HAs + LAs in England</div>
        </div>
        <div style="background:white; border-radius:12px; padding:20px; box-shadow:0 2px 10px rgba(0,0,0,0.06); border-left:5px solid #7dd3d0;">
          <div style="font-size:12px; color:#999; text-transform:uppercase; letter-spacing:1px;">Serviceable Addressable Market</div>
          <div style="font-size:28px; font-weight:800; color:#1a1a2e;">~400 orgs</div>
          <div style="font-size:14px; color:#666;">£40M–£80M per year</div>
          <div style="font-size:12px; color:#999; margin-top:4px;">Reachable within 5 years</div>
        </div>
        <div style="background:linear-gradient(135deg, #00AAA4, #005f5c); border-radius:12px; padding:20px; box-shadow:0 2px 10px rgba(0,170,164,0.3);">
          <div style="font-size:12px; color:rgba(255,255,255,0.7); text-transform:uppercase; letter-spacing:1px;">Year 3 Target</div>
          <div style="font-size:28px; font-weight:800; color:white;">27 customers</div>
          <div style="font-size:14px; color:rgba(255,255,255,0.9);">£1.14M ARR</div>
        </div>
      </div>
    </div>
    '''
    render(html, 'info_tam_sam_som.png', 1100, 580)


# ═══════════════════════════════════════════════════════════════
# 6. KEY METRICS DASHBOARD
# ═══════════════════════════════════════════════════════════════

def chart_key_metrics():
    metrics = [
        ('Investment Ask', '£480k', 'Bridges to breakeven Year 3'),
        ('Year 3 ARR', '£1.14M', 'Breakeven + first profits'),
        ('Year 6 Valuation', '£100M', 'At 8× annual revenue'),
        ('Year 10 ARR', '£32.4M', '242 customers, all segments'),
        ('Gross Margin', '40%+', 'From Year 4 onward'),
        ('Return Multiple', '540×', 'On £480k investment'),
    ]

    cards = ''
    for title, value, desc in metrics:
        cards += f'''
        <div style="background:white; border-radius:14px; padding:22px; box-shadow:0 3px 15px rgba(0,0,0,0.06); text-align:center; flex:1; min-width:160px;">
          <div style="font-size:11px; color:#999; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px;">{title}</div>
          <div style="font-size:30px; font-weight:800; color:{DARK_TEAL}; margin-bottom:4px;">{value}</div>
          <div style="font-size:12px; color:#888;">{desc}</div>
        </div>'''

    html = f'''
    <div class="container">
      <h2>Investment Highlights</h2>
      <p class="subtitle">SocialHomes.Ai — Key Financial Metrics</p>
      <div style="display:flex; gap:16px; flex-wrap:wrap;">
        {cards}
      </div>
    </div>
    '''
    render(html, 'info_key_metrics.png', 1200, 340)


# ═══════════════════════════════════════════════════════════════
# 7. MARKET ENTRY TIMELINE
# ═══════════════════════════════════════════════════════════════

def chart_market_entry():
    phases = [
        ('Y1-2', 'Small HAs', '1,000–5,000 homes', '~180 providers', '#7dd3d0', '10-15 customers'),
        ('Y3-4', 'Mid-market', '5,000–15,000 homes', '~60 providers', '#00AAA4', '27-48 customers'),
        ('Y5-6', 'Large + Enterprise', '15,000–50,000 homes', '~70 providers', '#008080', '77-112 customers'),
        ('Y7-10', 'G15 & Full Market', '50,000–125,000 homes', 'G15 members', '#005f5c', '147-242 customers'),
    ]

    items = ''
    for period, segment, homes, providers, color, target in phases:
        items += f'''
        <div style="display:flex; gap:16px; align-items:stretch; margin-bottom:12px;">
          <div style="width:80px; background:{color}; border-radius:10px; display:flex; align-items:center; justify-content:center; color:white; font-weight:700; font-size:16px; min-height:80px;">{period}</div>
          <div style="flex:1; background:white; border-radius:10px; padding:16px 20px; box-shadow:0 2px 8px rgba(0,0,0,0.04); border-left:4px solid {color};">
            <div style="font-size:16px; font-weight:700; color:#1a1a2e;">{segment}</div>
            <div style="font-size:13px; color:#666;">{homes} — {providers}</div>
            <div style="font-size:12px; color:{color}; font-weight:600; margin-top:4px;">Target: {target}</div>
          </div>
        </div>'''

    html = f'''
    <div class="container">
      <h2>Market Entry Strategy</h2>
      <p class="subtitle">Phased expansion from small HAs to G15 mega providers</p>
      {items}
    </div>
    '''
    render(html, 'info_market_entry.png', 900, 480)


# ═══════════════════════════════════════════════════════════════
# GENERATE ALL
# ═══════════════════════════════════════════════════════════════

if __name__ == '__main__':
    print('Generating infographic charts...')
    chart_market_segmentation()
    chart_arr_growth()
    chart_customer_growth()
    chart_pricing_comparison()
    chart_tam_sam_som()
    chart_key_metrics()
    chart_market_entry()
    print('All infographic charts generated!')
