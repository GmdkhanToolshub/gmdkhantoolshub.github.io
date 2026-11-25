# -*- coding: utf-8 -*-
"""Business brochure, media kit and partnership proposal in the current GM Tools Hub brand.
Run: python build/make-partner-pdfs.py   (writes assets/downloads/*.pdf). Check the facts below whenever the site changes."""
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor, white
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NAVY, BLUE, TEAL, INK, SOFT, PALE = (HexColor(x) for x in ('#0B1630', '#245BDB', '#0F9D94', '#16203A', '#5C6880', '#BCCCEC'))
W, H = A4
SITE, MAIL = 'gmtoolshub.com', 'asmarkniazi@gmail.com'
TOOLS = 74  # count shown on /tools/
BODY = ParagraphStyle('b', fontName='Helvetica', fontSize=10, leading=14.2, textColor=INK, spaceAfter=6)
BUL = ParagraphStyle('u', parent=BODY, leftIndent=14, bulletIndent=3, spaceAfter=3)
H1 = ParagraphStyle('h1', fontName='Helvetica-Bold', fontSize=20, leading=25, textColor=NAVY, spaceAfter=8)
H2 = ParagraphStyle('h2', fontName='Helvetica-Bold', fontSize=12.5, leading=16, textColor=BLUE, spaceBefore=9, spaceAfter=5)
ABOUT = ('GM Tools Hub is an independent digital business run by Gmd Khan Niazi (Ghulam Mohiuddin Khan Niazi) in Lahore, Pakistan. '
         'Gmd Khan Niazi is a Project Manager and Sales Operations professional with more than nine years of experience across FMCG, consumer goods and consumer electronics. '
         'GM publishes free online tools, learning resources and premium Excel templates, and builds Excel dashboards, reporting packs and HR trackers for businesses.')

def cover(c, title, sub):
    c.setFillColor(NAVY); c.rect(0, 0, W, H, stroke=0, fill=1)
    c.setFillColor(TEAL); c.rect(56, H - 250, 56, 5, stroke=0, fill=1)
    c.setFillColor(white); c.setFont('Helvetica-Bold', 40)
    for i, w in enumerate(title.split()): c.drawString(56, H - 310 - i * 48, w)
    c.setFillColor(PALE); c.setFont('Helvetica', 14)
    for i, line in enumerate(sub): c.drawString(56, H - 440 - i * 21, line)
    c.setFillColor(white); c.setFont('Helvetica-Bold', 15); c.drawString(56, 108, 'GM Tools Hub')
    c.setFillColor(PALE); c.setFont('Helvetica', 10.5); c.drawString(56, 88, 'Gmd Khan Niazi  |  %s  |  %s' % (SITE, MAIL))
    c.linkURL('https://' + SITE + '/', (56, 82, 400, 126)); c.showPage()

def page(c, label, number, blocks):
    c.setFillColor(NAVY); c.rect(0, H - 54, W, 54, stroke=0, fill=1)
    c.setFillColor(white); c.setFont('Helvetica-Bold', 11); c.drawString(56, H - 33, 'GM TOOLS HUB  |  ' + label)
    y = H - 86
    for kind, text in blocks:
        p = Paragraph(text, BUL, bulletText='•') if kind == 'li' else Paragraph(text, {'h1': H1, 'h2': H2, 'p': BODY}[kind])
        y -= p.style.spaceBefore
        _, ph = p.wrap(W - 112, H); p.drawOn(c, 56, y - ph); y -= ph + p.style.spaceAfter
        if y < 56: raise SystemExit('page %s of %s overflows' % (number, label))
    c.setFillColor(SOFT); c.setFont('Helvetica', 8.5); c.drawString(56, 32, 'GM Tools Hub  |  %s  |  %s' % (SITE, MAIL)); c.drawRightString(W - 56, 32, 'Page %d' % number)
    c.showPage()

def build(name, title, meta_title, sub, label, pages):
    c = canvas.Canvas(os.path.join(ROOT, 'assets', 'downloads', name), pagesize=A4)
    c.setTitle(meta_title); c.setAuthor('Gmd Khan Niazi (GM Tools Hub)'); c.setSubject('GM Tools Hub')
    cover(c, title, sub)
    for i, blocks in enumerate(pages): page(c, label, i + 2, blocks)
    c.save(); print('built', name)

def P(*t): return [('p', x) for x in t]
def L(*t): return [('li', x) for x in t]
def H_(t): return [('h2', t)]
def link(path, text=None): return '<link href="https://%s/%s" color="#245BDB">%s</link>' % (SITE, path, text or (SITE + '/' + path))

build('GM-Business-Brochure.pdf', 'Business Solutions', 'GM Business Solutions Brochure', ['Excel dashboards, reporting and HR systems', 'for growing companies worldwide'], 'BUSINESS BROCHURE', [
    [('h1', 'Business solutions')] + P(ABOUT)
    + H_('What we build') + L('Sales and distribution dashboards: targets, run-rate, territory and product reporting.', 'KPI scorecards: weighted scoring, ratings and rankings.', 'HR attendance and leave systems: exceptions-only logs, leave balances, Friday and Saturday or Saturday and Sunday weekends.', 'Inventory and stock tracking: reorder alerts and profit per product.', 'Management reporting packs: one clean monthly summary from raw exports.', 'Excel automation and clean-up: fewer manual steps, data checks and clear documentation.')
    + H_('How a project works') + L('<b>Brief:</b> a short description of what you track and what you want to see.', '<b>Quote:</b> a written quote with scope, price and timeline, in Pakistani rupees for clients in Pakistan or US dollars for international clients.', '<b>Build and review:</b> you see progress and give feedback.', '<b>Handover:</b> the finished Excel file, a short guide and a walkthrough.')
    + H_('Where we work') + P('Remote delivery for businesses in Pakistan, the Gulf region, the UK and Europe, and North America and Australia. Pakistan time is one to two hours ahead of the Gulf, and our workflow is asynchronous for distant time zones.')
    + H_('Our principles') + L('Clear written scope and price before any work starts.', 'Your data is used only for your project and is never shared. A confidentiality agreement can be signed on request.', 'You receive a normal Excel file with no subscription or lock-in.', 'We do not promise business results. We build accurate reporting so you can decide faster.'),
    [('h1', 'Ready-made templates and free versions')] + P('Prefer to start small? GM sells Excel templates, with prices shown in US dollars and Pakistani rupees, and offers free Lite versions with no sign-up.')
    + L('HR Attendance and Leave Tracker, Team KPI Scorecard, Sales Target and Daily Run-Rate Tracker, Inventory and Sales Tracker, Invoice Generator and Payment Tracker, Personal Budget Planner.', 'Professional CV Pack and Interview Success Pack for job seekers.')
    + P('Free Lite templates: ' + link('free-templates/'), 'Shop: ' + link('shop/'))
    + H_('Get a quote') + P('Send your requirements through the form at ' + link('services/#enquiry') + ' or email ' + MAIL + ' with a short description of your project, your country, your budget range and your deadline.')
    + H_('Contact') + P('Gmd Khan Niazi (Ghulam Mohiuddin Khan Niazi), Lahore, Pakistan', 'Email: ' + MAIL, 'Web: ' + link('', SITE), 'LinkedIn: linkedin.com/in/ghulammohiuddin-niazi-gmd-0166772fa')])

build('GM-Media-Kit.pdf', 'Media Kit', 'GM Media Kit', ['Facts, descriptions and brand details', 'for media and partners'], 'MEDIA KIT', [
    [('h1', 'Media kit')] + P('Facts and ready-to-use descriptions for journalists, bloggers, partners and event organisers.')
    + H_('Short description (about 40 words)') + P('GM Tools Hub offers free online tools, learning resources and premium Excel templates. It was created by Gmd Khan Niazi, a Project Manager and Sales Operations professional in Lahore, Pakistan, who also builds Excel dashboards and HR trackers for businesses worldwide.')
    + H_('Long description') + P(ABOUT + ' Premium products show prices in US dollars with Pakistani rupee equivalents, and free Lite templates are available with no sign-up.')
    + H_('Quick facts') + L('Founder: Gmd Khan Niazi (Ghulam Mohiuddin Khan Niazi). Based in Lahore, Pakistan.', 'Website: %s. Contact: %s.' % (SITE, MAIL), 'Products: %d free tools and gadgets, Learn and Grow, GM Embed (free embeddable calculators), GM HCM (HR software, in preparation), and a shop of Excel templates and printable packs.' % TOOLS, 'Services: Excel dashboards, KPI scorecards, HR attendance systems, inventory tracking and reporting packs, delivered remotely.'),
    [('h1', 'Brand and collaboration')] + H_('Brand') + P('Name: GM Tools Hub (short form: GM). Primary colours: deep navy #0B1630, blue #245BDB and teal #0F9D94. The logo is a rounded square with the letters GM.')
    + H_('Audience') + P('GM serves students, job seekers, professionals, small business owners, and HR and sales teams. Visitor numbers, countries and engagement are not published here. They can be shared from Google Analytics reports on request.')
    + H_('Ways to collaborate') + L('Interviews, features and reviews.', 'Guest articles and joint guides.', 'Sponsored content (always labelled) and tool sponsorships.', 'Referral and reseller partnerships.', 'Workshops and webinars on Excel reporting and job-search skills.')
    + H_('Press and partnership contact') + P('Gmd Khan Niazi, ' + MAIL, link('media-kit/'), link('partners/'))])

build('GM-Partnership-Proposal.pdf', 'Partnership Proposal', 'GM Partnership Proposal', ['How organisations can work with GM:', 'referrals, templates, content and sponsorship'], 'PARTNERSHIP PROPOSAL', [
    [('h1', 'Partnership proposal')] + P('This document explains how organisations can work with GM Tools Hub. It is an invitation to talk, not an offer or a contract. All terms are agreed in writing before any work or payment.')
    + H_('About GM') + P(ABOUT)
    + H_('Partnership models') + L('<b>Referral partner.</b> Accountants, consultants and agencies who introduce clients who need dashboards, reporting or HR tracking. Terms, if any, are agreed in writing.', '<b>Template reseller or co-branded templates.</b> Offer GM Excel templates to your own customers, or have a template adapted to your brand.', '<b>Sponsored content and placements.</b> Clearly labelled sponsored articles or tool sponsorships. See ' + link('advertise/') + '.', '<b>Content and training collaboration.</b> Joint guides, webinars or workshops for small-business owners, HR teams and job seekers.', '<b>Software and tool partners.</b> Honest reviews and recommendations of products relevant to GM readers. Affiliate relationships are always disclosed.')
    + H_('What GM brings') + L('Original Excel products and a free tools library.', 'More than nine years of sales operations and reporting experience.', 'Remote delivery and a written scope and price before work starts.', 'A transparent approach: no fake reviews, no purchased traffic, no misleading claims.'),
    [('h1', 'How we would work together')] + L('<b>Introduction.</b> Tell us who you are, who you serve and what you would like to achieve.', '<b>Fit check.</b> We check that the partnership helps your customers and GM readers.', '<b>Written agreement.</b> Scope, responsibilities, any fees or commission, and how either side can end the arrangement.', '<b>Launch and review.</b> We agree how results will be measured and review them together.')
    + H_('Our principles') + L('No commitments, payments or public statements before both sides agree in writing.', 'Sponsored and affiliate content is always disclosed.', 'We do not send unsolicited bulk messages and we do not buy traffic or reviews.', 'We do not make guarantees about sales, rankings or income.')
    + H_('Audience information') + P('GM uses Google Analytics (connected on 10 November 2026). Audience figures such as visitors, countries and engagement can be shared from Analytics reports on request. We do not publish estimates.')
    + H_('Next step') + P('Email ' + MAIL + ' with a short introduction and the type of partnership you have in mind.', 'Partnership page: ' + link('partners/'))])
