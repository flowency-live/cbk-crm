-- ============================================================
-- Seed data — Cheshire demo companies
-- 0003_seed.sql  (safe to skip in production)
-- ============================================================

insert into organizations
  (name, company_number, company_type, status, sector, sic_code, town, county, postcode,
   incorporated_on, ch_status, accounts_next_due, confirmation_next_due, phone)
values
  ('Bollington Brew Co Ltd','09832145','Private limited','client','Hospitality','11050 - Manufacture of beer','Bollington','Cheshire East','SK10 5JH','2016-03-12','Active','2026-12-31','2027-03-26','01625 573214'),
  ('Wilmslow Wellness Studio Ltd','12044871','Private limited','client','Health & Fitness','93130 - Fitness facilities','Wilmslow','Cheshire East','SK9 1BX','2019-08-04','Active','2027-04-30','2026-08-18','01625 449082'),
  ('Chester Timber & Joinery Ltd','08120934','Private limited','client','Construction','16230 - Builders carpentry','Chester','Cheshire West','CH1 3AE','2012-06-21','Active','2026-09-30','2026-07-05','01244 320118'),
  ('Knutsford Kitchen Studio Ltd','13567229','Private limited','prospect','Retail','47591 - Retail of furniture','Knutsford','Cheshire East','WA16 6DA','2021-09-15','Active','2026-12-31','2026-09-14','01565 651120'),
  ('Crewe Auto Repairs Ltd','10299384','Private limited','client','Automotive','45200 - Maintenance of motor vehicles','Crewe','Cheshire East','CW1 2QP','2017-01-30','Active','2026-10-31','2027-02-12','01270 215583'),
  ('Nantwich Digital Ltd','14002271','Private limited','prospect','Technology','62012 - Business software development','Nantwich','Cheshire East','CW5 5AS','2022-02-02','Active','2027-02-28','2027-02-01','01270 887441'),
  ('Macclesfield Print House Ltd','07788321','Private limited','dormant','Manufacturing','18129 - Printing n.e.c.','Macclesfield','Cheshire East','SK11 6LF','2011-11-18','Active',null,'2026-11-22','01625 612009'),
  ('Sandbach Florals Ltd','13881204','Private limited','client','Retail','47760 - Retail of flowers & plants','Sandbach','Cheshire East','CW11 1AT','2021-12-09','Active','2026-09-30','2026-12-08','01270 768432'),
  ('Northwich Care Services Ltd','11540982','Private limited','client','Healthcare','88100 - Social work without accommodation','Northwich','Cheshire West','CW9 5BT','2018-08-25','Active','2027-05-31','2026-08-30','01606 331207'),
  ('Alderley Edge Interiors Ltd','12993017','Private limited','prospect','Retail','74100 - Specialised design','Alderley Edge','Cheshire East','SK9 7DZ','2020-05-11','Active','2027-05-31','2027-05-10','01625 590112')
on conflict do nothing;

-- contacts
insert into contacts (org_id, full_name, email, phone, title, is_primary, source)
select id, v.full_name, v.email, v.phone, v.title, v.is_primary, 'companies_house'
from organizations o
join (values
  ('09832145','Sarah Mellor','sarah@bollingtonbrew.co.uk','01625 573214','Director',true),
  ('09832145','James Mellor','james@bollingtonbrew.co.uk',null,'Director',false),
  ('12044871','Priya Shah','priya@wilmslowwellness.com','01625 449082','Director',true),
  ('08120934','Mark Ridley','accounts@chestertimber.co.uk','01244 320118','Director',true),
  ('08120934','Anne Ridley',null,null,'Director',false),
  ('13567229','Helen Carter','helen@knutsfordkitchens.co.uk','01565 651120','Director',true),
  ('10299384','Dave Hollins','dave@creweauto.co.uk','01270 215583','Director',true),
  ('14002271','Olivia Grant','olivia@nantwichdigital.com','01270 887441','Director',true),
  ('07788321','Geoff Barlow','geoff@maccprint.co.uk','01625 612009','Director',true),
  ('13881204','Emma Whitlow','hello@sandbachflorals.co.uk','01270 768432','Director',true),
  ('11540982','Rachel Owen','rachel@northwichcare.co.uk','01606 331207','Director',true),
  ('12993017','Charlotte Dean','charlotte@aeinteriors.co.uk','01625 590112','Director',true)
) as v(num, full_name, email, phone, title, is_primary) on o.company_number = v.num
on conflict do nothing;

-- activities (recent, drives "last activity")
insert into activities (org_id, type, subject, body, created_at)
select o.id, v.type::activity_type, v.subject, v.body, now() - (v.days || ' days')::interval
from organizations o
join (values
  ('09832145','call','Discussed Q2 VAT return','Confirmed figures with Sarah',2),
  ('12044871','meeting','Year-end planning','Reviewed accounts approach',1),
  ('08120934','call','CIS subcontractor query','6 subcontractors to verify',3),
  ('13567229','email','Sent proposal','Awaiting response',7),
  ('10299384','call','Quarterly catch-up','All on track',4),
  ('14002271','email','Intro email','Possible R&D claim',14),
  ('07788321','task','Filed dormant accounts','Submitted to CH',90),
  ('13881204','call','Valentine stock financing','Cashflow plan agreed',6),
  ('11540982','meeting','Payroll for 22 carers','Variable hours setup',0),
  ('12993017','email','Sent welcome pack','Referred by Knutsford Kitchen',5)
) as v(num, type, subject, body, days) on o.company_number = v.num;

-- notes
insert into notes (org_id, body)
select o.id, v.body
from organizations o
join (values
  ('09832145','Prefers Xero. Quarterly VAT, monthly payroll for 8 staff.'),
  ('12044871','Sole director. Wants help with self-assessment too.'),
  ('08120934','CIS scheme - 6 subcontractors. Confirmation statement due soon.'),
  ('13567229','Warm lead from networking event. Unhappy with current national firm.'),
  ('10299384','Cash-heavy business, watch reconciliations.'),
  ('14002271','May qualify for R&D tax credits. Follow up.'),
  ('07788321','Trading paused 2025. Filing dormant accounts only.'),
  ('13881204','Highly seasonal - peaks Feb & May. Plan cashflow around it.'),
  ('11540982','Large payroll - 22 staff, variable hours. VAT exempt supplies.'),
  ('12993017','High-end interior design. Referred by Knutsford Kitchen Studio.')
) as v(num, body) on o.company_number = v.num;

-- tags + taggables
insert into tags (label) values
  ('VAT'),('Monthly'),('Self-assessment'),('CIS'),('Lead'),('R&D'),
  ('Cash basis'),('Seasonal'),('Payroll'),('Dormant'),('VAT exempt')
on conflict do nothing;

insert into taggables (tag_id, entity_type, entity_id)
select tg.id, 'organization', o.id
from organizations o
join (values
  ('09832145','VAT'),('09832145','Monthly'),
  ('12044871','Self-assessment'),
  ('08120934','CIS'),('08120934','VAT'),
  ('13567229','Lead'),
  ('10299384','VAT'),('10299384','Cash basis'),
  ('14002271','Lead'),('14002271','R&D'),
  ('07788321','Dormant'),
  ('13881204','VAT'),('13881204','Seasonal'),
  ('11540982','Payroll'),('11540982','VAT exempt'),
  ('12993017','Lead')
) as v(num, label) on o.company_number = v.num
join tags tg on tg.label = v.label
on conflict do nothing;
