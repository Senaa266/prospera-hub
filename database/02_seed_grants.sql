-- Seed data: 7 real micro-grants for African women entrepreneurs
-- Source: see sources.md for URLs and verification dates
-- Run after 01_schema.sql

USE prospera_db;

INSERT INTO grants
(provider_name, grant_title, description, target_sector, max_amount, requires_registration, deadline, application_url)
VALUES
('MTN Ghana', 'MTN SME Support Programme',
 'Working capital funding, training, and mentorship for MSMEs including women-led businesses in commerce and agribusiness.',
 'Any', 20000.00, TRUE, '2026-06-30', 'https://www.innohub.com.gh/mtn-sme'),

('Absa Ghana', 'Absa Young Africa Works Project',
 'Funding and business development support for MSMEs, with 72% of funding going to women-owned businesses.',
 'Any', 50000.00, TRUE, '2026-12-31', 'https://www.absa.com.gh'),

('Tony Elumelu Foundation', 'TEF Entrepreneurship Programme',
 'US$5,000 non-refundable seed capital plus training and mentorship for African founders. 46% female participation.',
 'Any', 5000.00, FALSE, '2026-03-01', 'https://www.tefconnect.com'),

('Ghana Enterprises Agency', 'YouStart Programme',
 'Government grant and training initiative targeting 50% women and youth entrepreneurs aged 18-40.',
 'Any', 10000.00, TRUE, '2026-12-31', 'https://gea.gov.gh'),

('Mastercard Foundation / GEA', 'BizBox Programme',
 'Startup kits, training, and market access for young agri-business entrepreneurs. 70%+ women participants. In-kind support, not direct cash.',
 'Agriculture', 0.00, TRUE, '2027-04-30', 'https://mastercardfdn.org'),

('African Development Bank', 'AFAWA Initiative',
 'Flagship initiative bridging the gender financing gap for women entrepreneurs through partner financial institutions. Programmatic funding, not direct-to-individual.',
 'Any', 0.00, TRUE, '2026-12-31', 'https://afawa.afdb.org'),

('UN Women', 'UN Women Empowerment Grant',
 'Training, mentoring, and financial management skills for up to 10,000 female entrepreneurs across Africa.',
 'Any', 0.00, TRUE, '2026-12-31', 'https://africa.unwomen.org');