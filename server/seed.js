const db = require('./db');
const bcrypt = require('bcryptjs');

async function seed() {
  if (process.env.NODE_ENV === 'production' || process.env.ALLOW_DEMO_SEED !== 'true') {
    throw new Error('Destructive demo seed refused. Set ALLOW_DEMO_SEED=true outside production.');
  }
  console.log('🌱 Starting database seed...');

  // Create tables
  await db.query(`
    DROP TABLE IF EXISTS payments CASCADE;
    DROP TABLE IF EXISTS photos CASCADE;
    DROP TABLE IF EXISTS daily_logs CASCADE;
    DROP TABLE IF EXISTS warranties CASCADE;
    DROP TABLE IF EXISTS communications CASCADE;
    DROP TABLE IF EXISTS punchlist CASCADE;
    DROP TABLE IF EXISTS rooms CASCADE;
    DROP TABLE IF EXISTS vendors CASCADE;
    DROP TABLE IF EXISTS documents CASCADE;
    DROP TABLE IF EXISTS inspections CASCADE;
    DROP TABLE IF EXISTS materials CASCADE;
    DROP TABLE IF EXISTS projects CASCADE;
    DROP TABLE IF EXISTS change_orders CASCADE;
    DROP TABLE IF EXISTS budget_items CASCADE;
    DROP TABLE IF EXISTS timeline_tasks CASCADE;
    DROP TABLE IF EXISTS designs CASCADE;
    DROP TABLE IF EXISTS permits CASCADE;
    DROP TABLE IF EXISTS contractors CASCADE;
    DROP TABLE IF EXISTS users CASCADE;

    CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE contractors (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      specialty VARCHAR(255),
      phone VARCHAR(50),
      email VARCHAR(255),
      license_number VARCHAR(100),
      insurance_verified BOOLEAN DEFAULT false,
      rating DECIMAL(3,2) DEFAULT 0,
      hourly_rate DECIMAL(10,2),
      years_experience INTEGER,
      location VARCHAR(255),
      availability_status VARCHAR(50) DEFAULT 'available',
      portfolio_url VARCHAR(500),
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE permits (
      id SERIAL PRIMARY KEY,
      permit_type VARCHAR(100) NOT NULL,
      description TEXT,
      jurisdiction VARCHAR(255),
      status VARCHAR(50) DEFAULT 'pending',
      submission_date DATE,
      approval_date DATE,
      expiration_date DATE,
      fee DECIMAL(10,2),
      inspector_name VARCHAR(255),
      inspector_phone VARCHAR(50),
      project_address VARCHAR(500),
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE budget_items (
      id SERIAL PRIMARY KEY,
      category VARCHAR(100) NOT NULL,
      description TEXT,
      estimated_cost DECIMAL(12,2),
      actual_cost DECIMAL(12,2) DEFAULT 0,
      vendor VARCHAR(255),
      status VARCHAR(50) DEFAULT 'planned',
      priority VARCHAR(20) DEFAULT 'medium',
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE change_orders (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      original_cost DECIMAL(12,2),
      new_cost DECIMAL(12,2),
      reason TEXT,
      impact_timeline VARCHAR(255),
      status VARCHAR(50) DEFAULT 'pending',
      requested_by VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE designs (
      id SERIAL PRIMARY KEY,
      room_type VARCHAR(100) NOT NULL,
      style VARCHAR(100),
      description TEXT,
      color_palette VARCHAR(500),
      materials TEXT,
      dimensions VARCHAR(255),
      estimated_cost DECIMAL(12,2),
      status VARCHAR(50) DEFAULT 'concept',
      designer_name VARCHAR(255),
      inspiration_url VARCHAR(500),
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE timeline_tasks (
      id SERIAL PRIMARY KEY,
      task_name VARCHAR(255) NOT NULL,
      phase VARCHAR(100),
      description TEXT,
      start_date DATE,
      end_date DATE,
      assigned_contractor VARCHAR(255),
      status VARCHAR(50) DEFAULT 'not_started',
      dependencies VARCHAR(500),
      priority VARCHAR(20) DEFAULT 'medium',
      completion_percentage INTEGER DEFAULT 0,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE projects (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      address VARCHAR(500),
      project_type VARCHAR(100),
      total_budget DECIMAL(12,2),
      start_date DATE,
      end_date DATE,
      status VARCHAR(50) DEFAULT 'planning',
      description TEXT,
      client_name VARCHAR(255),
      client_phone VARCHAR(50),
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE materials (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100),
      supplier VARCHAR(255),
      quantity DECIMAL(10,2),
      unit VARCHAR(50),
      unit_price DECIMAL(10,2),
      total_cost DECIMAL(12,2),
      status VARCHAR(50) DEFAULT 'needed',
      delivery_date DATE,
      room VARCHAR(100),
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE inspections (
      id SERIAL PRIMARY KEY,
      inspection_type VARCHAR(100) NOT NULL,
      inspector_name VARCHAR(255),
      inspector_phone VARCHAR(50),
      scheduled_date DATE,
      completed_date DATE,
      status VARCHAR(50) DEFAULT 'scheduled',
      result VARCHAR(100),
      area VARCHAR(255),
      permit_ref VARCHAR(100),
      follow_up_required BOOLEAN DEFAULT false,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE documents (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      document_type VARCHAR(100),
      category VARCHAR(100),
      file_name VARCHAR(500),
      uploaded_by VARCHAR(255),
      description TEXT,
      tags VARCHAR(500),
      version VARCHAR(20) DEFAULT '1.0',
      status VARCHAR(50) DEFAULT 'active',
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE vendors (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100),
      contact_name VARCHAR(255),
      phone VARCHAR(50),
      email VARCHAR(255),
      website VARCHAR(500),
      rating DECIMAL(3,2) DEFAULT 0,
      payment_terms VARCHAR(100),
      delivery_speed VARCHAR(100),
      location VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE rooms (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      floor VARCHAR(50),
      room_type VARCHAR(100),
      dimensions VARCHAR(100),
      square_footage DECIMAL(10,2),
      current_condition VARCHAR(100),
      renovation_scope TEXT,
      estimated_cost DECIMAL(12,2),
      status VARCHAR(50) DEFAULT 'not_started',
      assigned_contractor VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE punchlist (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      room VARCHAR(100),
      category VARCHAR(100),
      assigned_to VARCHAR(255),
      priority VARCHAR(20) DEFAULT 'medium',
      status VARCHAR(50) DEFAULT 'open',
      due_date DATE,
      reported_by VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE communications (
      id SERIAL PRIMARY KEY,
      subject VARCHAR(255) NOT NULL,
      message TEXT,
      from_name VARCHAR(255),
      to_name VARCHAR(255),
      comm_type VARCHAR(50) DEFAULT 'note',
      comm_date DATE,
      priority VARCHAR(20) DEFAULT 'normal',
      status VARCHAR(50) DEFAULT 'open',
      related_to VARCHAR(255),
      follow_up_date DATE,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE daily_logs (
      id SERIAL PRIMARY KEY,
      log_date DATE NOT NULL,
      weather VARCHAR(50),
      temperature VARCHAR(20),
      crew_size INTEGER,
      hours_worked DECIMAL(4,1),
      work_performed TEXT,
      issues TEXT,
      materials_used TEXT,
      visitor_log TEXT,
      safety_incidents TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE photos (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      room VARCHAR(100),
      phase VARCHAR(20) DEFAULT 'before',
      description TEXT,
      photo_url VARCHAR(500),
      taken_date DATE,
      tags VARCHAR(500),
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE payments (
      id SERIAL PRIMARY KEY,
      payee_name VARCHAR(255) NOT NULL,
      payment_type VARCHAR(50) DEFAULT 'progress',
      amount DECIMAL(12,2),
      payment_method VARCHAR(50) DEFAULT 'check',
      payment_date DATE,
      invoice_number VARCHAR(100),
      category VARCHAR(100),
      description TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      due_date DATE,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE warranties (
      id SERIAL PRIMARY KEY,
      item_name VARCHAR(255) NOT NULL,
      category VARCHAR(100),
      provider VARCHAR(255),
      warranty_type VARCHAR(100),
      start_date DATE,
      expiration_date DATE,
      coverage_details TEXT,
      claim_process TEXT,
      contact_phone VARCHAR(50),
      contact_email VARCHAR(255),
      cost DECIMAL(10,2),
      status VARCHAR(50) DEFAULT 'active',
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('✅ Tables created');

  // Seed users
  const hash = await bcrypt.hash('password123', 10);
  await db.query(
    `INSERT INTO users (name, email, password_hash) VALUES
      ('John Homeowner', 'john@example.com', $1),
      ('Sarah Builder', 'sarah@example.com', $1)`,
    [hash]
  );
  console.log('✅ Users seeded');

  // Seed contractors (15+)
  await db.query(`
    INSERT INTO contractors (name, specialty, phone, email, license_number, insurance_verified, rating, hourly_rate, years_experience, location, availability_status, portfolio_url, notes) VALUES
    ('Mike Johnson', 'General Contractor', '(555) 101-0001', 'mike@buildright.com', 'GC-2024-1001', true, 4.8, 85.00, 22, 'Austin, TX', 'available', 'https://mikebuilds.com', 'Specializes in whole-home renovations. Great communication.'),
    ('Elena Rodriguez', 'Kitchen Remodeling', '(555) 101-0002', 'elena@kitchencraft.com', 'KC-2024-1002', true, 4.9, 95.00, 15, 'Austin, TX', 'available', 'https://elenakitchens.com', 'Award-winning kitchen designer and installer.'),
    ('David Chen', 'Electrical', '(555) 101-0003', 'david@sparkelectric.com', 'EL-2024-1003', true, 4.7, 75.00, 18, 'Round Rock, TX', 'available', 'https://sparkelectric.com', 'Master electrician, smart home specialist.'),
    ('Amanda Foster', 'Plumbing', '(555) 101-0004', 'amanda@flowplumbing.com', 'PL-2024-1004', true, 4.6, 80.00, 12, 'Cedar Park, TX', 'busy', 'https://flowplumbing.com', 'Specializes in bathroom remodels and water heater installation.'),
    ('Robert Williams', 'Roofing', '(555) 101-0005', 'robert@topcover.com', 'RF-2024-1005', true, 4.5, 70.00, 25, 'Austin, TX', 'available', 'https://topcover.com', '25 years of roofing experience. Storm damage expert.'),
    ('Lisa Park', 'Interior Design', '(555) 101-0006', 'lisa@designharmony.com', 'ID-2024-1006', true, 4.9, 110.00, 10, 'Austin, TX', 'available', 'https://designharmony.com', 'ASID certified. Modern and transitional styles.'),
    ('James Brown', 'HVAC', '(555) 101-0007', 'james@coolcomfort.com', 'HV-2024-1007', true, 4.4, 72.00, 16, 'Pflugerville, TX', 'available', 'https://coolcomfort.com', 'Energy-efficient HVAC installations and repairs.'),
    ('Maria Gonzalez', 'Painting', '(555) 101-0008', 'maria@colorpro.com', 'PT-2024-1008', true, 4.8, 55.00, 8, 'Austin, TX', 'available', 'https://colorpro.com', 'Interior and exterior painting. Faux finish specialist.'),
    ('Thomas Wright', 'Flooring', '(555) 101-0009', 'thomas@floormaster.com', 'FL-2024-1009', true, 4.7, 65.00, 14, 'Austin, TX', 'busy', 'https://floormaster.com', 'Hardwood, tile, LVP installation expert.'),
    ('Jessica Lee', 'Bathroom Remodeling', '(555) 101-0010', 'jessica@bathdesign.com', 'BR-2024-1010', true, 4.8, 90.00, 11, 'Lakeway, TX', 'available', 'https://bathdesign.com', 'Luxury bathroom remodels. ADA compliant designs.'),
    ('Kevin Murphy', 'Landscaping', '(555) 101-0011', 'kevin@greenscapes.com', 'LS-2024-1011', true, 4.6, 60.00, 9, 'Austin, TX', 'available', 'https://greenscapes.com', 'Drought-resistant landscaping specialist.'),
    ('Rachel Kim', 'Windows & Doors', '(555) 101-0012', 'rachel@windowworks.com', 'WD-2024-1012', true, 4.5, 68.00, 13, 'Georgetown, TX', 'available', 'https://windowworks.com', 'Energy-efficient window and door installations.'),
    ('Carlos Martinez', 'Masonry', '(555) 101-0013', 'carlos@stoneartisan.com', 'MS-2024-1013', true, 4.7, 75.00, 20, 'Austin, TX', 'available', 'https://stoneartisan.com', 'Stone, brick, and concrete work specialist.'),
    ('Nicole Taylor', 'Cabinetry', '(555) 101-0014', 'nicole@customcabs.com', 'CB-2024-1014', true, 4.9, 88.00, 17, 'Austin, TX', 'busy', 'https://customcabs.com', 'Custom cabinet maker. Solid wood and modern designs.'),
    ('Steven Anderson', 'Structural Engineering', '(555) 101-0015', 'steven@solidframe.com', 'SE-2024-1015', true, 4.8, 120.00, 28, 'Austin, TX', 'available', 'https://solidframe.com', 'Licensed PE. Load-bearing wall removal specialist.'),
    ('Patricia Davis', 'Tile & Stone', '(555) 101-0016', 'patricia@tileart.com', 'TS-2024-1016', true, 4.6, 62.00, 10, 'Round Rock, TX', 'available', 'https://tileart.com', 'Custom tile mosaics and natural stone installation.')
  `);
  console.log('✅ Contractors seeded (16)');

  // Seed permits (15+)
  await db.query(`
    INSERT INTO permits (permit_type, description, jurisdiction, status, submission_date, approval_date, expiration_date, fee, inspector_name, inspector_phone, project_address, notes) VALUES
    ('Building Permit', 'Full kitchen renovation including wall removal', 'City of Austin', 'approved', '2025-01-15', '2025-02-01', '2026-02-01', 1250.00, 'Tom Richards', '(555) 200-0001', '123 Oak Street, Austin, TX 78701', 'Structural review completed. Load-bearing wall removal approved.'),
    ('Electrical Permit', 'Kitchen electrical upgrade - 200 amp panel', 'City of Austin', 'approved', '2025-01-20', '2025-02-05', '2026-02-05', 450.00, 'Sarah Mitchell', '(555) 200-0002', '123 Oak Street, Austin, TX 78701', 'Panel upgrade from 100A to 200A approved.'),
    ('Plumbing Permit', 'Bathroom remodel - new fixture locations', 'City of Austin', 'pending', '2025-02-10', NULL, '2026-03-10', 375.00, 'Mark Johnson', '(555) 200-0003', '123 Oak Street, Austin, TX 78701', 'Waiting for plan review. Submitted relocation drawings.'),
    ('Mechanical Permit', 'HVAC system replacement - central air', 'City of Austin', 'approved', '2025-01-25', '2025-02-10', '2026-02-10', 325.00, 'Jim Cooper', '(555) 200-0004', '123 Oak Street, Austin, TX 78701', 'New 3-ton Trane unit approved.'),
    ('Demolition Permit', 'Interior wall removal - kitchen to living', 'City of Austin', 'approved', '2025-01-10', '2025-01-20', '2025-07-20', 200.00, 'Tom Richards', '(555) 200-0001', '123 Oak Street, Austin, TX 78701', 'Asbestos test completed - negative.'),
    ('Roofing Permit', 'Complete roof replacement - architectural shingles', 'Travis County', 'in_review', '2025-02-15', NULL, NULL, 550.00, 'Diana Clark', '(555) 200-0005', '123 Oak Street, Austin, TX 78701', 'HOA approval needed before county review.'),
    ('Fence Permit', 'New 6ft cedar privacy fence - backyard', 'City of Austin', 'approved', '2025-01-05', '2025-01-12', '2026-01-12', 150.00, 'Robert Green', '(555) 200-0006', '123 Oak Street, Austin, TX 78701', 'Survey completed. Property lines confirmed.'),
    ('Window Permit', 'Replace 12 windows with energy-efficient models', 'City of Austin', 'pending', '2025-02-20', NULL, NULL, 280.00, 'Sarah Mitchell', '(555) 200-0002', '123 Oak Street, Austin, TX 78701', 'Energy audit submitted with application.'),
    ('Gas Permit', 'Gas line extension for outdoor kitchen', 'City of Austin', 'approved', '2025-01-28', '2025-02-12', '2026-02-12', 225.00, 'Jim Cooper', '(555) 200-0004', '123 Oak Street, Austin, TX 78701', 'Line pressure test scheduled.'),
    ('Foundation Permit', 'Foundation repair - pier and beam leveling', 'City of Austin', 'in_review', '2025-02-05', NULL, NULL, 800.00, 'Tom Richards', '(555) 200-0001', '123 Oak Street, Austin, TX 78701', 'Engineering report submitted. Awaiting structural review.'),
    ('Pool Permit', 'In-ground pool installation - 15x30', 'Travis County', 'pending', '2025-02-25', NULL, NULL, 1500.00, 'Diana Clark', '(555) 200-0005', '123 Oak Street, Austin, TX 78701', 'Requires separate fence permit for pool enclosure.'),
    ('Driveway Permit', 'Concrete driveway expansion and resurfacing', 'City of Austin', 'approved', '2025-01-18', '2025-01-28', '2026-01-28', 175.00, 'Robert Green', '(555) 200-0006', '123 Oak Street, Austin, TX 78701', 'Drainage plan approved. No impervious cover issues.'),
    ('Solar Permit', 'Solar panel installation - 8kW system', 'City of Austin', 'in_review', '2025-02-18', NULL, NULL, 350.00, 'Sarah Mitchell', '(555) 200-0002', '123 Oak Street, Austin, TX 78701', 'Austin Energy interconnection application also submitted.'),
    ('Deck Permit', 'New 400 sqft composite deck - backyard', 'City of Austin', 'approved', '2025-01-22', '2025-02-08', '2026-02-08', 425.00, 'Tom Richards', '(555) 200-0001', '123 Oak Street, Austin, TX 78701', 'Footings must be 18 inches deep per code.'),
    ('Fire Sprinkler Permit', 'Residential fire sprinkler system addition', 'City of Austin', 'pending', '2025-03-01', NULL, NULL, 600.00, 'Mark Johnson', '(555) 200-0003', '123 Oak Street, Austin, TX 78701', 'Required for addition over 500 sqft per 2024 code update.'),
    ('Sewer Permit', 'Sewer line replacement - clay to PVC', 'Austin Water', 'approved', '2025-01-30', '2025-02-14', '2026-02-14', 300.00, 'Jim Cooper', '(555) 200-0004', '123 Oak Street, Austin, TX 78701', 'Camera inspection revealed cracked clay pipe.')
  `);
  console.log('✅ Permits seeded (16)');

  // Seed budget items (15+)
  await db.query(`
    INSERT INTO budget_items (category, description, estimated_cost, actual_cost, vendor, status, priority, notes) VALUES
    ('Kitchen', 'Custom cabinetry - shaker style white oak', 18500.00, 19200.00, 'CustomCabs Inc', 'completed', 'high', 'Upgraded to soft-close hinges. Extra $700.'),
    ('Kitchen', 'Quartz countertops - Calacatta Laza', 8500.00, 8500.00, 'Stone Center', 'completed', 'high', 'Installed with undermount sink cutout.'),
    ('Kitchen', 'Appliance package - Wolf/Sub-Zero', 22000.00, 21500.00, 'Ferguson', 'completed', 'high', 'Got 2% contractor discount.'),
    ('Kitchen', 'Backsplash - handmade zellige tile', 3200.00, 3800.00, 'TileArt Studio', 'in_progress', 'medium', 'Pattern more complex than estimated.'),
    ('Bathroom', 'Master bath - freestanding soaking tub', 4500.00, 4500.00, 'Bath Design Co', 'ordered', 'high', 'Bain Ultra Essencia model. 6-week lead time.'),
    ('Bathroom', 'Walk-in shower - frameless glass enclosure', 6800.00, 0, 'Glass Masters', 'planned', 'high', 'Custom size. Template after tile completion.'),
    ('Bathroom', 'Heated floor system - master bath', 2200.00, 2200.00, 'WarmlyYours', 'completed', 'medium', 'Thermostat installed in hallway.'),
    ('Flooring', 'White oak hardwood - main living areas', 15000.00, 14800.00, 'Floor Master', 'in_progress', 'high', 'European white oak, 7 inch wide plank.'),
    ('Flooring', 'Porcelain tile - bathrooms and laundry', 4500.00, 0, 'Tile Outlet', 'planned', 'medium', 'Large format 24x48 with linear drain.'),
    ('Electrical', 'Panel upgrade - 200 amp service', 3500.00, 3500.00, 'Spark Electric', 'completed', 'critical', 'Required before kitchen renovation could proceed.'),
    ('Electrical', 'Smart home wiring - Cat6 and low voltage', 4800.00, 5100.00, 'Spark Electric', 'in_progress', 'medium', 'Added 4 extra drops for cameras.'),
    ('HVAC', 'New central AC unit - 3 ton', 8500.00, 8200.00, 'Cool Comfort', 'completed', 'high', 'SEER rating 18. Qualifies for rebate.'),
    ('Painting', 'Interior painting - whole house', 7500.00, 0, 'ColorPro', 'planned', 'medium', 'Benjamin Moore Advance. 12 rooms + hallways.'),
    ('Windows', 'Energy-efficient windows - 12 units', 14000.00, 0, 'Window Works', 'planned', 'medium', 'Andersen 400 series. Triple pane.'),
    ('Landscaping', 'Front yard drought-resistant redesign', 8000.00, 0, 'Green Scapes', 'planned', 'low', 'Native Texas plants. Drip irrigation system.'),
    ('Structural', 'Load-bearing wall removal - kitchen', 4500.00, 4800.00, 'Solid Frame Eng', 'completed', 'critical', 'Steel beam installed. LVL 3.5x14.')
  `);
  console.log('✅ Budget items seeded (16)');

  // Seed change orders (15+)
  await db.query(`
    INSERT INTO change_orders (title, description, original_cost, new_cost, reason, impact_timeline, status, requested_by, notes) VALUES
    ('Cabinet hardware upgrade', 'Upgrade from standard to brass hardware throughout kitchen', 450.00, 1200.00, 'Homeowner requested premium Rejuvenation hardware', '0 days', 'approved', 'Homeowner', 'All pulls and knobs. 42 pieces total.'),
    ('Subfloor repair - kitchen', 'Water damage discovered under old kitchen floor', 0, 3200.00, 'Hidden water damage from dishwasher leak', '+3 days', 'approved', 'Contractor', 'Insurance claim filed. Mold remediation included.'),
    ('Electrical outlet additions', 'Add 6 additional outlets in kitchen island', 0, 1800.00, 'Code requirement - outlets every 24 inches', '+1 day', 'approved', 'Inspector', 'Required per NEC 210.52(C) for kitchen islands.'),
    ('Window size upgrade', 'Enlarge kitchen window from 36" to 48" width', 2800.00, 4200.00, 'Homeowner wants more natural light', '+2 days', 'approved', 'Homeowner', 'Requires header modification. Structural approved.'),
    ('Tile pattern change', 'Change backsplash from subway to herringbone pattern', 3200.00, 3800.00, 'Design preference change after seeing sample', '+1 day', 'approved', 'Designer', 'More complex installation. Material cost similar.'),
    ('Plumbing reroute', 'Reroute drain line for new island sink location', 1500.00, 3500.00, 'Island moved 3 feet per updated design', '+4 days', 'approved', 'Contractor', 'Required jackhammering concrete slab.'),
    ('Add recessed lighting', 'Install 8 recessed LED lights in kitchen ceiling', 0, 2400.00, 'Insufficient lighting per design review', '+2 days', 'approved', 'Designer', 'Wafer-style LED. Dimmable with Lutron switches.'),
    ('Upgrade insulation', 'Add spray foam insulation to exterior walls', 2000.00, 5500.00, 'Energy audit recommended during wall opening', '+3 days', 'pending', 'Energy Auditor', 'R-38 closed cell. Will improve HVAC efficiency.'),
    ('Move gas line', 'Relocate gas line for range from wall to island', 800.00, 2200.00, 'Range moved to island per new layout', '+2 days', 'approved', 'Contractor', 'Requires gas pressure test and inspection.'),
    ('Add pot filler', 'Install pot filler faucet behind range', 0, 1500.00, 'Homeowner addition request during plumbing rough-in', '+1 day', 'approved', 'Homeowner', 'Brizo Litze model. Hot water line only.'),
    ('Shower niche addition', 'Add double recessed niche in master shower', 0, 800.00, 'Design improvement during tile layout', '0 days', 'approved', 'Designer', 'Schluter prefab niche. Waterproof membrane.'),
    ('Duct modification', 'Reroute HVAC duct around new steel beam', 0, 1200.00, 'Beam placement conflicts with existing ductwork', '+1 day', 'approved', 'HVAC Contractor', 'Flex duct reroute. CFM verified after modification.'),
    ('Permit re-submission', 'Updated plans require new permit review', 350.00, 700.00, 'Scope changes require amended permit', '+5 days', 'pending', 'City Inspector', 'Expedited review requested. Additional fee.'),
    ('Waterproofing upgrade', 'Upgrade shower waterproofing to Kerdi system', 600.00, 1400.00, 'Better warranty and waterproofing performance', '0 days', 'approved', 'Contractor', 'Full Schluter system. Lifetime warranty.'),
    ('Smart thermostat', 'Add Ecobee smart thermostat with room sensors', 0, 650.00, 'Homeowner wants smart HVAC control', '0 days', 'approved', 'Homeowner', 'Ecobee Premium. 4 room sensors included.'),
    ('Drywall upgrade', 'Upgrade to moisture-resistant drywall in all wet areas', 1800.00, 2600.00, 'Contractor recommendation for long-term protection', '+1 day', 'pending', 'Contractor', 'Purple board throughout bathrooms and laundry.')
  `);
  console.log('✅ Change orders seeded (16)');

  // Seed designs (15+)
  await db.query(`
    INSERT INTO designs (room_type, style, description, color_palette, materials, dimensions, estimated_cost, status, designer_name, inspiration_url, notes) VALUES
    ('Kitchen', 'Modern Farmhouse', 'Open concept kitchen with large island, white oak cabinets, and professional-grade appliances', 'White (#FFFFFF), Warm Oak (#C4A77D), Matte Black (#1A1A1A), Sage (#9CAF88)', 'White oak cabinets, quartz countertops, zellige tile backsplash, hardwood floors', '20x15 ft', 65000.00, 'in_progress', 'Lisa Park', 'https://pinterest.com/pin/kitchen1', 'Central island seats 4. Integrated wine fridge.'),
    ('Master Bathroom', 'Spa-Inspired Modern', 'Luxurious master bath with freestanding tub, walk-in rainfall shower, and double vanity', 'Warm White (#F5F0E8), Marble Gray (#8E8E8E), Brass (#C5A572), Forest (#2D4A2D)', 'Marble tile, frameless glass, brass fixtures, teak accents', '12x14 ft', 35000.00, 'approved', 'Lisa Park', 'https://pinterest.com/pin/bath1', 'Heated floors. Linear drain. LED mirror.'),
    ('Living Room', 'Transitional', 'Open living space connected to kitchen with built-in entertainment center and fireplace', 'Greige (#B5A99A), Navy (#2C3E6B), Cream (#F5F0DC), Walnut (#5C4033)', 'Walnut built-ins, limestone fireplace surround, wide plank oak floors', '22x18 ft', 28000.00, 'approved', 'Lisa Park', 'https://pinterest.com/pin/living1', 'Gas fireplace conversion. Hidden TV mount.'),
    ('Guest Bathroom', 'Contemporary', 'Stylish guest bath with floating vanity, large format tile, and statement mirror', 'White (#FFFFFF), Charcoal (#36454F), Gold (#D4AF37), Blue (#4A90D9)', 'Porcelain tile, floating oak vanity, brushed gold fixtures', '8x10 ft', 15000.00, 'concept', 'Jessica Lee', 'https://pinterest.com/pin/guestbath1', 'Pocket door for space savings.'),
    ('Primary Bedroom', 'Scandinavian Modern', 'Serene primary suite with custom closet system and reading nook', 'Soft White (#F8F4EF), Light Gray (#D3D3D3), Blush (#E8C4C4), Natural (#DEB887)', 'White oak, linen textiles, wool carpet, plaster walls', '16x14 ft', 18000.00, 'concept', 'Lisa Park', 'https://pinterest.com/pin/bedroom1', 'Custom California Closets system included.'),
    ('Home Office', 'Mid-Century Modern', 'Dedicated home office with built-in desk, library wall, and soundproofing', 'Olive (#708238), Teak (#B8860B), White (#FFFFFF), Mustard (#E1AD01)', 'Teak desk and shelving, acoustic panels, hardwood floor', '12x10 ft', 12000.00, 'approved', 'Lisa Park', 'https://pinterest.com/pin/office1', 'Soundproofing between walls. Dedicated circuit.'),
    ('Laundry Room', 'Modern Utility', 'Functional laundry room with custom folding station and pet wash', 'Sky Blue (#87CEEB), White (#FFFFFF), Gray (#808080), Chrome (#C0C0C0)', 'Quartz counter, ceramic tile, custom cabinetry, utility sink', '8x8 ft', 8000.00, 'in_progress', 'Nicole Taylor', 'https://pinterest.com/pin/laundry1', 'Stacked W/D to maximize counter space.'),
    ('Mudroom', 'Farmhouse', 'Entry mudroom with built-in bench, coat hooks, and shoe storage', 'White (#FFFFFF), Sage (#9CAF88), Wood (#8B7355), Black (#000000)', 'Shiplap walls, painted wood bench, tile floor, iron hooks', '6x8 ft', 5500.00, 'concept', 'Nicole Taylor', 'https://pinterest.com/pin/mudroom1', 'Heated boot tray. Dog wash station addition.'),
    ('Outdoor Kitchen', 'Texas Hill Country', 'Covered outdoor kitchen with grill station, bar, and pizza oven', 'Stone (#8B7D6B), Black (#1A1A1A), Cedar (#A0522D), Copper (#B87333)', 'Austin limestone, stainless steel, cedar pergola, copper accents', '16x12 ft', 45000.00, 'concept', 'Kevin Murphy', 'https://pinterest.com/pin/outdoor1', 'Under existing patio cover. Gas and electric hookups.'),
    ('Dining Room', 'Contemporary Elegant', 'Formal dining room with statement lighting and custom millwork', 'Deep Blue (#1B2A4A), Gold (#C5A572), White (#FFFFFF), Walnut (#5C4033)', 'Walnut wainscoting, plaster ceiling medallion, hardwood floor', '14x12 ft', 15000.00, 'approved', 'Lisa Park', 'https://pinterest.com/pin/dining1', 'Chandelier requires reinforced ceiling box.'),
    ('Garage', 'Modern Functional', 'Two-car garage conversion to workshop and organized storage', 'Gray (#808080), Red (#CC0000), White (#FFFFFF), Silver (#C0C0C0)', 'Epoxy floor, metal cabinets, pegboard walls, LED lighting', '22x20 ft', 10000.00, 'concept', 'Mike Johnson', 'https://pinterest.com/pin/garage1', 'EV charger outlet. Extra insulation for workshop.'),
    ('Powder Room', 'Jewel Box', 'Bold powder room with wallpaper, vessel sink, and statement mirror', 'Emerald (#046307), Gold (#D4AF37), Black (#000000), Cream (#FFFDD0)', 'Patterned wallpaper, marble vessel sink, brass fixtures', '5x6 ft', 7500.00, 'in_progress', 'Jessica Lee', 'https://pinterest.com/pin/powder1', 'Wallpaper is special order. 4-week lead time.'),
    ('Patio', 'Modern Desert', 'Covered patio extension with lounge area and fire pit', 'Terracotta (#CC6633), Sand (#C2B280), Black (#1A1A1A), Green (#355E3B)', 'Concrete pavers, steel fire pit, stucco columns, native plants', '20x16 ft', 25000.00, 'concept', 'Kevin Murphy', 'https://pinterest.com/pin/patio1', 'Requires foundation extension. Permit needed.'),
    ('Hallway', 'Gallery Style', 'Long hallway transformation with gallery lighting and millwork', 'White (#FFFFFF), Warm Gray (#9E9E9E), Wood (#DEB887), Black (#1A1A1A)', 'Picture frame molding, hardwood floor, gallery lights', '30x4 ft', 4500.00, 'approved', 'Lisa Park', 'https://pinterest.com/pin/hall1', 'Low-profile LED picture lights. Art placement plan.'),
    ('Kids Room', 'Playful Modern', 'Child bedroom with built-in bed, study nook, and creative storage', 'Sky Blue (#87CEEB), Yellow (#FFD700), White (#FFFFFF), Coral (#FF7F7F)', 'Painted MDF built-ins, carpet, chalkboard paint accent wall', '12x11 ft', 9000.00, 'concept', 'Nicole Taylor', 'https://pinterest.com/pin/kids1', 'Convertible design that grows with child.'),
    ('Wine Cellar', 'Rustic Elegance', 'Temperature-controlled wine storage with tasting area', 'Burgundy (#800020), Stone (#8B7D6B), Iron (#48494B), Wood (#654321)', 'Reclaimed wood racks, stone floor, wrought iron door, climate system', '10x8 ft', 20000.00, 'concept', 'Lisa Park', 'https://pinterest.com/pin/wine1', 'Requires vapor barrier and dedicated cooling.')
  `);
  console.log('✅ Designs seeded (16)');

  // Seed timeline tasks (15+)
  await db.query(`
    INSERT INTO timeline_tasks (task_name, phase, description, start_date, end_date, assigned_contractor, status, dependencies, priority, completion_percentage, notes) VALUES
    ('Design Finalization', 'Pre-Construction', 'Finalize all design plans and material selections', '2025-01-06', '2025-01-31', 'Lisa Park', 'completed', NULL, 'critical', 100, 'All designs approved by homeowner.'),
    ('Permit Acquisition', 'Pre-Construction', 'Submit and obtain all required building permits', '2025-01-15', '2025-02-15', 'Mike Johnson', 'completed', 'Design Finalization', 'critical', 100, 'All major permits approved.'),
    ('Demolition', 'Phase 1', 'Remove existing kitchen, demo walls, strip bathrooms', '2025-02-17', '2025-02-28', 'Mike Johnson', 'completed', 'Permit Acquisition', 'high', 100, 'Dumpster rental included. Asbestos test negative.'),
    ('Structural Work', 'Phase 1', 'Install steel beam for load-bearing wall removal', '2025-03-03', '2025-03-07', 'Steven Anderson', 'completed', 'Demolition', 'critical', 100, 'Beam installed and inspected. Passed structural.'),
    ('Rough Plumbing', 'Phase 2', 'Run new plumbing lines for kitchen and bathrooms', '2025-03-10', '2025-03-21', 'Amanda Foster', 'completed', 'Structural Work', 'high', 100, 'All lines pressure tested. Passed inspection.'),
    ('Rough Electrical', 'Phase 2', 'New wiring, panel upgrade, smart home pre-wire', '2025-03-10', '2025-03-28', 'David Chen', 'completed', 'Structural Work', 'high', 100, 'Panel upgrade complete. 42 new circuits.'),
    ('HVAC Installation', 'Phase 2', 'Install new HVAC system and ductwork modifications', '2025-03-17', '2025-03-28', 'James Brown', 'completed', 'Structural Work', 'high', 100, 'New Trane unit installed. Duct modifications complete.'),
    ('Insulation & Drywall', 'Phase 3', 'Spray foam insulation and new drywall throughout', '2025-03-31', '2025-04-11', 'Mike Johnson', 'in_progress', 'Rough Plumbing, Rough Electrical, HVAC Installation', 'high', 65, 'Insulation done. Drywall hanging in progress.'),
    ('Flooring Installation', 'Phase 3', 'Install hardwood in main areas, tile in wet areas', '2025-04-14', '2025-04-25', 'Thomas Wright', 'not_started', 'Insulation & Drywall', 'high', 0, 'White oak acclimating in garage. Tile on order.'),
    ('Cabinet Installation', 'Phase 4', 'Install kitchen and bathroom cabinetry', '2025-04-28', '2025-05-09', 'Nicole Taylor', 'not_started', 'Flooring Installation', 'high', 0, 'Cabinets in storage. Final measurements taken.'),
    ('Countertop Installation', 'Phase 4', 'Template, fabricate, and install quartz countertops', '2025-05-12', '2025-05-16', 'Stone Center', 'not_started', 'Cabinet Installation', 'high', 0, 'Template after cabinets. 5-day fabrication.'),
    ('Tile Work', 'Phase 4', 'Backsplash, shower tile, bathroom floors', '2025-05-12', '2025-05-30', 'Patricia Davis', 'not_started', 'Cabinet Installation', 'medium', 0, 'Zellige backsplash. Large format bathroom tile.'),
    ('Painting', 'Phase 5', 'Interior painting throughout entire home', '2025-06-02', '2025-06-13', 'Maria Gonzalez', 'not_started', 'Tile Work, Countertop Installation', 'medium', 0, 'Benjamin Moore palette. 2 coats minimum.'),
    ('Fixture Installation', 'Phase 5', 'Install all plumbing and electrical fixtures', '2025-06-16', '2025-06-20', 'Amanda Foster, David Chen', 'not_started', 'Painting', 'high', 0, 'All fixtures received and stored.'),
    ('Final Inspections', 'Closeout', 'Schedule and pass all required inspections', '2025-06-23', '2025-06-27', 'Mike Johnson', 'not_started', 'Fixture Installation', 'critical', 0, 'Building, electrical, plumbing, mechanical inspections.'),
    ('Landscaping', 'Phase 6', 'Front yard redesign and patio extension', '2025-06-16', '2025-07-04', 'Kevin Murphy', 'not_started', 'Painting', 'low', 0, 'Can run parallel with fixture installation.'),
    ('Final Punch List', 'Closeout', 'Walk-through and complete all punch list items', '2025-06-30', '2025-07-04', 'Mike Johnson', 'not_started', 'Final Inspections', 'high', 0, 'Homeowner walk-through scheduled.'),
    ('Deep Cleaning', 'Closeout', 'Professional deep clean of entire renovation area', '2025-07-07', '2025-07-08', 'CleanPro Services', 'not_started', 'Final Punch List', 'medium', 0, 'Post-construction cleaning. Window cleaning included.')
  `);
  console.log('✅ Timeline tasks seeded (18)');

  // Seed projects (15)
  await db.query(`
    INSERT INTO projects (name, address, project_type, total_budget, start_date, end_date, status, description, client_name, client_phone, notes) VALUES
    ('Oak Street Full Renovation', '123 Oak Street, Austin, TX 78701', 'Whole Home', 185000.00, '2025-01-06', '2025-07-08', 'in_progress', 'Complete home renovation including kitchen, bathrooms, flooring, and landscaping', 'John Smith', '(555) 300-0001', 'Primary residence. Family of 4. Temporarily relocated.'),
    ('Lakeway Kitchen Remodel', '456 Lakeshore Dr, Lakeway, TX 78734', 'Kitchen', 65000.00, '2025-03-01', '2025-05-15', 'planning', 'High-end kitchen renovation with custom cabinetry and professional appliances', 'Sarah Johnson', '(555) 300-0002', 'Lake house. Weekend project timeline preferred.'),
    ('Downtown Condo Update', '789 Congress Ave #1204, Austin, TX 78701', 'Condo', 45000.00, '2025-02-15', '2025-04-30', 'in_progress', 'Modern condo update with new kitchen, bathroom, and flooring', 'Michael Chen', '(555) 300-0003', 'HOA approval received. Noise restrictions 9am-5pm.'),
    ('Cedar Park Master Suite', '321 Cedar Blvd, Cedar Park, TX 78613', 'Addition', 95000.00, '2025-04-01', '2025-08-30', 'planning', 'Master suite addition with walk-in closet and spa bathroom', 'Lisa Davis', '(555) 300-0004', 'Foundation and structural plans complete.'),
    ('Round Rock Bathroom Remodel', '654 Round Rock Ave, Round Rock, TX 78664', 'Bathroom', 35000.00, '2025-02-01', '2025-03-31', 'completed', 'Two bathroom renovation - master and guest', 'Tom Wilson', '(555) 300-0005', 'Completed on time and under budget.'),
    ('Pflugerville Outdoor Living', '987 Pflug Lane, Pflugerville, TX 78660', 'Outdoor', 55000.00, '2025-05-01', '2025-07-31', 'planning', 'Outdoor kitchen, patio extension, and pool area renovation', 'Amy Rodriguez', '(555) 300-0006', 'Pool permit pending. Starting with patio.'),
    ('Georgetown Historic Restore', '147 Main St, Georgetown, TX 78626', 'Historic', 120000.00, '2025-03-15', '2025-09-30', 'in_progress', 'Historic home restoration preserving original character with modern updates', 'Robert Taylor', '(555) 300-0007', 'Historic preservation board approval required.'),
    ('Bee Cave Modern Build', '258 Bee Cave Rd, Bee Cave, TX 78738', 'Modern', 210000.00, '2025-06-01', '2025-12-31', 'planning', 'Complete modern renovation of 1990s home with contemporary design', 'Jennifer White', '(555) 300-0008', 'Architect plans in review. Permits not yet submitted.'),
    ('Dripping Springs Farmhouse', '369 Ranch Road, Dripping Springs, TX 78620', 'Farmhouse', 78000.00, '2025-04-15', '2025-07-15', 'planning', 'Farmhouse style renovation with shiplap, barn doors, and rustic finishes', 'David Brown', '(555) 300-0009', 'Well water system needs upgrade first.'),
    ('Westlake Energy Retrofit', '741 Westlake Dr, West Lake Hills, TX 78746', 'Energy', 42000.00, '2025-02-20', '2025-04-20', 'in_progress', 'Energy efficiency upgrade - solar, insulation, windows, and smart home', 'Karen Martinez', '(555) 300-0010', 'Austin Energy rebate application submitted.'),
    ('South Austin ADU', '852 S Lamar Blvd, Austin, TX 78704', 'ADU', 135000.00, '2025-05-15', '2025-10-31', 'planning', 'Accessory dwelling unit construction for rental income', 'Chris Lee', '(555) 300-0011', 'ADU regulations changed in 2024. Compliant design.'),
    ('Mueller Townhouse Refresh', '963 Mueller Blvd, Austin, TX 78723', 'Townhouse', 28000.00, '2025-03-01', '2025-04-15', 'in_progress', 'Townhouse interior refresh - paint, floors, fixtures', 'Emily Garcia', '(555) 300-0012', 'HOA colors pre-approved. Interior only.'),
    ('Tarrytown Kitchen & Bath', '159 Tarrytown Dr, Austin, TX 78703', 'Kitchen/Bath', 88000.00, '2025-04-01', '2025-06-30', 'planning', 'Kitchen and two bathroom renovations in mid-century home', 'Steve Anderson', '(555) 300-0013', 'Mid-century design elements to be preserved.'),
    ('Barton Hills Deck & Patio', '267 Barton Hills Dr, Austin, TX 78704', 'Outdoor', 32000.00, '2025-03-15', '2025-05-15', 'in_progress', 'New composite deck, stone patio, and outdoor fireplace', 'Nancy Thompson', '(555) 300-0014', 'Hillside lot. Extra engineering for deck supports.'),
    ('Hyde Park Bungalow', '378 Hyde Park Blvd, Austin, TX 78751', 'Bungalow', 62000.00, '2025-05-01', '2025-08-15', 'planning', 'Craftsman bungalow renovation preserving original woodwork', 'Mark Robinson', '(555) 300-0015', 'Lead paint abatement required before interior work.')
  `);
  console.log('✅ Projects seeded (15)');

  // Seed materials (16)
  await db.query(`
    INSERT INTO materials (name, category, supplier, quantity, unit, unit_price, total_cost, status, delivery_date, room, notes) VALUES
    ('European White Oak Hardwood', 'Flooring', 'Floor Master', 1200, 'sqft', 8.50, 10200.00, 'delivered', '2025-02-15', 'Main Living Areas', '7-inch wide plank. Acclimating in garage.'),
    ('Quartz Countertop - Calacatta', 'Countertops', 'Stone Center', 45, 'sqft', 85.00, 3825.00, 'installed', '2025-02-01', 'Kitchen', 'Calacatta Laza pattern. Includes sink cutout.'),
    ('Zellige Tile - White', 'Tile', 'TileArt Studio', 120, 'sqft', 18.00, 2160.00, 'delivered', '2025-02-20', 'Kitchen', 'Handmade zellige for backsplash. 10% overage included.'),
    ('White Oak Shaker Cabinets', 'Cabinetry', 'CustomCabs Inc', 32, 'units', 578.00, 18496.00, 'installed', '2025-01-25', 'Kitchen', 'Soft-close hinges. Custom sizes for island.'),
    ('Porcelain Tile 24x48', 'Tile', 'Tile Outlet', 400, 'sqft', 6.50, 2600.00, 'ordered', '2025-04-01', 'Bathrooms', 'Large format. Gray concrete look. Non-slip finish.'),
    ('Frameless Glass Shower', 'Glass', 'Glass Masters', 1, 'unit', 4200.00, 4200.00, 'ordered', '2025-05-01', 'Master Bath', 'Custom size. 3/8 inch tempered. Brushed nickel hardware.'),
    ('Freestanding Soaking Tub', 'Fixtures', 'Bath Design Co', 1, 'unit', 4500.00, 4500.00, 'ordered', '2025-04-15', 'Master Bath', 'Bain Ultra Essencia. 6-week lead time.'),
    ('Wolf 48" Range', 'Appliances', 'Ferguson', 1, 'unit', 12500.00, 12500.00, 'installed', '2025-01-20', 'Kitchen', 'Dual fuel. 6 burners + griddle. Red knobs.'),
    ('Sub-Zero Refrigerator 36"', 'Appliances', 'Ferguson', 1, 'unit', 9000.00, 9000.00, 'installed', '2025-01-20', 'Kitchen', 'Built-in panel ready. Custom panel ordered.'),
    ('Andersen 400 Windows', 'Windows', 'Window Works', 12, 'units', 850.00, 10200.00, 'ordered', '2025-04-10', 'Whole House', 'Triple pane. White exterior, wood interior.'),
    ('Spray Foam Insulation', 'Insulation', 'Foam Pro', 2400, 'sqft', 2.25, 5400.00, 'installed', '2025-03-10', 'Exterior Walls', 'Closed cell R-38. Vapor barrier included.'),
    ('Benjamin Moore Paint', 'Paint', 'ColorPro', 25, 'gallons', 65.00, 1625.00, 'ordered', '2025-05-20', 'Whole House', 'Advance line. Whites and greiges per palette.'),
    ('Trane AC Unit 3-Ton', 'HVAC', 'Cool Comfort', 1, 'unit', 6800.00, 6800.00, 'installed', '2025-02-10', 'Utility Room', 'SEER 18. 10-year compressor warranty.'),
    ('Steel LVL Beam 3.5x14', 'Structural', 'Steel Supply Co', 1, 'unit', 2800.00, 2800.00, 'installed', '2025-03-01', 'Kitchen/Living', 'Load-bearing wall replacement. 16ft span.'),
    ('Lutron Caseta Switches', 'Electrical', 'Spark Electric', 28, 'units', 65.00, 1820.00, 'delivered', '2025-03-15', 'Whole House', 'Smart dimmers and switches. Hub included.'),
    ('Schluter Kerdi System', 'Waterproofing', 'TileArt Studio', 200, 'sqft', 4.50, 900.00, 'delivered', '2025-04-05', 'Bathrooms', 'Full waterproofing system. Shower and floor.')
  `);
  console.log('✅ Materials seeded (16)');

  // Seed inspections (15)
  await db.query(`
    INSERT INTO inspections (inspection_type, inspector_name, inspector_phone, scheduled_date, completed_date, status, result, area, permit_ref, follow_up_required, notes) VALUES
    ('Foundation', 'Tom Richards', '(555) 200-0001', '2025-02-17', '2025-02-17', 'completed', 'passed', 'Whole House', 'BP-2024-1001', false, 'Foundation in good condition. No settling issues.'),
    ('Rough Plumbing', 'Mark Johnson', '(555) 200-0003', '2025-03-21', '2025-03-21', 'completed', 'passed', 'Kitchen & Bathrooms', 'PP-2024-1004', false, 'All lines pressure tested. No leaks detected.'),
    ('Rough Electrical', 'Sarah Mitchell', '(555) 200-0002', '2025-03-28', '2025-03-28', 'completed', 'passed', 'Whole House', 'EP-2024-1002', false, 'Panel upgrade verified. All circuits labeled.'),
    ('HVAC Rough-In', 'Jim Cooper', '(555) 200-0004', '2025-03-28', '2025-03-28', 'completed', 'passed', 'Whole House', 'MP-2024-1004', false, 'Ductwork verified. CFM calculations confirmed.'),
    ('Structural - Beam', 'Tom Richards', '(555) 200-0001', '2025-03-07', '2025-03-07', 'completed', 'passed', 'Kitchen/Living', 'BP-2024-1001', false, 'Steel beam properly installed. Connections verified.'),
    ('Insulation', 'Tom Richards', '(555) 200-0001', '2025-04-02', '2025-04-02', 'completed', 'passed', 'Exterior Walls', 'BP-2024-1001', false, 'R-38 verified. No gaps or voids found.'),
    ('Drywall Nailing', 'Tom Richards', '(555) 200-0001', '2025-04-14', NULL, 'scheduled', NULL, 'Whole House', 'BP-2024-1001', false, 'Scheduled after drywall hanging complete.'),
    ('Waterproofing - Shower', 'Mark Johnson', '(555) 200-0003', '2025-04-20', NULL, 'scheduled', NULL, 'Master Bath', 'PP-2024-1004', false, 'Flood test required. 24-hour hold.'),
    ('Framing', 'Tom Richards', '(555) 200-0001', '2025-02-28', '2025-02-28', 'completed', 'passed', 'Kitchen/Living', 'BP-2024-1001', false, 'Wall framing verified per approved plans.'),
    ('Gas Line Pressure', 'Jim Cooper', '(555) 200-0004', '2025-03-15', '2025-03-15', 'completed', 'passed', 'Kitchen', 'GP-2024-1009', false, 'Gas line pressure held at 15 PSI for 30 minutes.'),
    ('Final Electrical', 'Sarah Mitchell', '(555) 200-0002', '2025-06-23', NULL, 'scheduled', NULL, 'Whole House', 'EP-2024-1002', false, 'All fixtures must be installed before inspection.'),
    ('Final Plumbing', 'Mark Johnson', '(555) 200-0003', '2025-06-24', NULL, 'scheduled', NULL, 'Whole House', 'PP-2024-1004', false, 'Test all fixtures. Check water heater.'),
    ('Final Mechanical', 'Jim Cooper', '(555) 200-0004', '2025-06-25', NULL, 'scheduled', NULL, 'Whole House', 'MP-2024-1004', false, 'Verify HVAC performance. Check thermostat.'),
    ('Final Building', 'Tom Richards', '(555) 200-0001', '2025-06-27', NULL, 'scheduled', NULL, 'Whole House', 'BP-2024-1001', false, 'Final walkthrough. Certificate of occupancy.'),
    ('Roofing', 'Diana Clark', '(555) 200-0005', '2025-03-20', NULL, 'pending', NULL, 'Roof', 'RF-2024-1005', false, 'Pending permit approval. HOA review in progress.')
  `);
  console.log('✅ Inspections seeded (15)');

  // Seed documents (16)
  await db.query(`
    INSERT INTO documents (title, document_type, category, file_name, uploaded_by, description, tags, version, status, notes) VALUES
    ('Architectural Floor Plans', 'Blueprint', 'Design', 'floor_plans_v3.pdf', 'Lisa Park', 'Complete floor plans for all renovation areas', 'plans,architecture,layout', '3.0', 'active', 'Revised after wall removal approval.'),
    ('Kitchen Design Renders', 'Render', 'Design', 'kitchen_renders_final.pdf', 'Lisa Park', '3D renderings of kitchen design from multiple angles', 'kitchen,render,3D', '2.0', 'active', 'Client approved final version.'),
    ('Building Permit Application', 'Permit', 'Legal', 'building_permit_app.pdf', 'Mike Johnson', 'City of Austin building permit application and approval', 'permit,legal,city', '1.0', 'active', 'Approved 2025-02-01.'),
    ('Contractor Agreement - GC', 'Contract', 'Legal', 'gc_contract_signed.pdf', 'John Smith', 'General contractor agreement with Mike Johnson', 'contract,legal,contractor', '1.0', 'active', 'Signed and notarized.'),
    ('Structural Engineering Report', 'Report', 'Engineering', 'structural_report.pdf', 'Steven Anderson', 'Structural analysis for wall removal and beam installation', 'structural,engineering,beam', '1.0', 'active', 'PE stamped and approved.'),
    ('Material Specifications', 'Specification', 'Materials', 'material_specs.xlsx', 'Lisa Park', 'Complete material specifications with model numbers and quantities', 'materials,specs,quantities', '4.0', 'active', 'Updated after change orders.'),
    ('Budget Spreadsheet', 'Spreadsheet', 'Financial', 'renovation_budget.xlsx', 'John Smith', 'Detailed budget tracking with all line items and change orders', 'budget,financial,tracking', '8.0', 'active', 'Updated weekly.'),
    ('Insurance Certificate - GC', 'Certificate', 'Insurance', 'gc_insurance_cert.pdf', 'Mike Johnson', 'General liability and workers comp insurance certificate', 'insurance,certificate,liability', '1.0', 'active', 'Expires 2026-01-15.'),
    ('Plumbing Rough-In Photos', 'Photos', 'Documentation', 'plumbing_roughin_photos.zip', 'Amanda Foster', 'Photo documentation of all rough plumbing before wall closure', 'photos,plumbing,rough-in', '1.0', 'active', 'Required for warranty documentation.'),
    ('Electrical Panel Schedule', 'Schedule', 'Engineering', 'panel_schedule.pdf', 'David Chen', 'Complete electrical panel schedule for 200A service', 'electrical,panel,schedule', '2.0', 'active', 'Updated after additional circuits added.'),
    ('HOA Approval Letter', 'Letter', 'Legal', 'hoa_approval.pdf', 'John Smith', 'HOA board approval for exterior modifications', 'hoa,approval,exterior', '1.0', 'active', 'Approved with conditions for paint colors.'),
    ('HVAC Load Calculation', 'Report', 'Engineering', 'hvac_load_calc.pdf', 'James Brown', 'Manual J load calculation for HVAC sizing', 'hvac,calculation,engineering', '1.0', 'active', '3-ton unit confirmed adequate.'),
    ('Change Order Log', 'Log', 'Financial', 'change_order_log.xlsx', 'Mike Johnson', 'Running log of all change orders with cost impact', 'change-orders,log,tracking', '5.0', 'active', 'Updated with each new CO.'),
    ('Warranty Documents Bundle', 'Warranty', 'Legal', 'warranty_bundle.pdf', 'John Smith', 'Collected warranty documents for all major appliances and materials', 'warranty,appliances,legal', '2.0', 'active', 'Updated as installations complete.'),
    ('Project Timeline - Gantt', 'Schedule', 'Management', 'project_gantt.pdf', 'Mike Johnson', 'Visual Gantt chart showing all project phases and milestones', 'timeline,gantt,schedule', '6.0', 'active', 'Updated after each phase completion.'),
    ('Energy Audit Report', 'Report', 'Engineering', 'energy_audit.pdf', 'Austin Energy', 'Pre-renovation energy audit with recommendations', 'energy,audit,efficiency', '1.0', 'active', 'Baseline for measuring improvement.')
  `);
  console.log('✅ Documents seeded (16)');

  // Seed vendors (16)
  await db.query(`
    INSERT INTO vendors (name, category, contact_name, phone, email, website, rating, payment_terms, delivery_speed, location, notes) VALUES
    ('Ferguson Enterprises', 'Appliances & Plumbing', 'Jake Reynolds', '(555) 400-0001', 'jake@ferguson.com', 'https://ferguson.com', 4.8, 'Net 30', '3-5 business days', 'Austin, TX', 'Best selection of high-end appliances. Trade discount available.'),
    ('Floor & Decor', 'Flooring & Tile', 'Maria Santos', '(555) 400-0002', 'maria@flooranddecor.com', 'https://flooranddecor.com', 4.5, 'Net 15', '1-2 business days', 'Austin, TX', 'Large in-stock selection. Contractor pricing program.'),
    ('Stone Center Austin', 'Countertops', 'Peter Zhang', '(555) 400-0003', 'peter@stonecenter.com', 'https://stonecenteraustin.com', 4.9, 'Net 30', '5-7 business days', 'Austin, TX', 'Premium quartz and natural stone. Fabrication in-house.'),
    ('CustomCabs Inc', 'Cabinetry', 'Nicole Taylor', '(555) 400-0004', 'nicole@customcabs.com', 'https://customcabs.com', 4.9, 'Net 45', '6-8 weeks', 'Austin, TX', 'Custom cabinet maker. Quality craftsmanship.'),
    ('Window Works Texas', 'Windows & Doors', 'Rachel Kim', '(555) 400-0005', 'rachel@windowworks.com', 'https://windowworkstx.com', 4.6, 'Net 30', '4-6 weeks', 'Georgetown, TX', 'Andersen and Marvin dealer. Installation included.'),
    ('Austin Lumber Co', 'Lumber & Building', 'Sam Walker', '(555) 400-0006', 'sam@austinlumber.com', 'https://austinlumber.com', 4.4, 'Net 15', 'Same day', 'Austin, TX', 'Local lumber yard. Delivery available. Good framing stock.'),
    ('Spark Electric Supply', 'Electrical', 'David Chen', '(555) 400-0007', 'david@sparksupply.com', 'https://sparksupply.com', 4.7, 'Net 30', '1-2 business days', 'Round Rock, TX', 'Full electrical supply. Lutron and Leviton dealer.'),
    ('Cool Comfort HVAC Supply', 'HVAC', 'James Brown', '(555) 400-0008', 'james@coolcomfort.com', 'https://coolcomfort.com', 4.5, 'Net 30', '3-5 business days', 'Pflugerville, TX', 'Trane and Carrier dealer. Parts and equipment.'),
    ('TileArt Studio', 'Specialty Tile', 'Patricia Davis', '(555) 400-0009', 'patricia@tileart.com', 'https://tileart.com', 4.8, 'Net 30', '2-4 weeks', 'Austin, TX', 'Artisan and imported tile. Zellige specialist.'),
    ('Green Scapes Nursery', 'Landscaping', 'Kevin Murphy', '(555) 400-0010', 'kevin@greenscapes.com', 'https://greenscapes.com', 4.6, 'Net 15', '2-3 business days', 'Austin, TX', 'Native Texas plants. Bulk soil and mulch delivery.'),
    ('Glass Masters TX', 'Glass & Mirrors', 'Tony Russo', '(555) 400-0011', 'tony@glassmasters.com', 'https://glassmasterstx.com', 4.7, 'Net 30', '2-3 weeks', 'Austin, TX', 'Custom shower glass and mirrors. Templating included.'),
    ('Steel Supply Co', 'Structural Steel', 'Frank Miller', '(555) 400-0012', 'frank@steelsupply.com', 'https://steelsupplyco.com', 4.5, 'Net 15', '3-5 business days', 'San Marcos, TX', 'Structural steel beams and columns. Cut to spec.'),
    ('Paint Pro Supply', 'Paint', 'Linda Garcia', '(555) 400-0013', 'linda@paintpro.com', 'https://paintpro.com', 4.4, 'Net 15', 'Same day', 'Austin, TX', 'Benjamin Moore and Sherwin-Williams dealer. Color matching.'),
    ('Foam Pro Insulation', 'Insulation', 'Rick Nelson', '(555) 400-0014', 'rick@foampro.com', 'https://foampro.com', 4.6, 'Net 30', '1 week', 'Austin, TX', 'Spray foam and blown-in insulation. Supply and install.'),
    ('Plumbing Depot', 'Plumbing Fixtures', 'Carol White', '(555) 400-0015', 'carol@plumbingdepot.com', 'https://plumbingdepot.com', 4.3, 'Net 30', '2-5 business days', 'Austin, TX', 'Wide selection of fixtures. Competitive pricing.'),
    ('Smart Home Central', 'Smart Home', 'Alex Turner', '(555) 400-0016', 'alex@smarthomecentral.com', 'https://smarthomecentral.com', 4.7, 'Net 15', '1-2 business days', 'Austin, TX', 'Lutron, Ecobee, Ring, Sonos dealer. System design.')
  `);
  console.log('✅ Vendors seeded (16)');

  // Seed rooms (15)
  await db.query(`
    INSERT INTO rooms (name, floor, room_type, dimensions, square_footage, current_condition, renovation_scope, estimated_cost, status, assigned_contractor, notes) VALUES
    ('Kitchen', '1st Floor', 'Kitchen', '20x15', 300, 'gutted', 'Full renovation - cabinets, counters, appliances, backsplash', 65000.00, 'in_progress', 'Mike Johnson', 'Island with seating for 4. Open to living room.'),
    ('Master Bathroom', '2nd Floor', 'Bathroom', '12x14', 168, 'demo_complete', 'Full renovation - tub, shower, vanity, tile, heated floor', 35000.00, 'in_progress', 'Jessica Lee', 'Freestanding tub. Walk-in rainfall shower.'),
    ('Living Room', '1st Floor', 'Living', '22x18', 396, 'framing_done', 'Wall removal, built-ins, fireplace conversion, new floors', 28000.00, 'in_progress', 'Mike Johnson', 'Open to kitchen after wall removal.'),
    ('Guest Bathroom', '1st Floor', 'Bathroom', '8x10', 80, 'not_started', 'Full renovation - floating vanity, large tile, glass enclosure', 15000.00, 'not_started', 'Jessica Lee', 'Pocket door installation needed.'),
    ('Primary Bedroom', '2nd Floor', 'Bedroom', '16x14', 224, 'not_started', 'Custom closet system, new flooring, paint, lighting', 18000.00, 'not_started', 'Lisa Park', 'California Closets consultation scheduled.'),
    ('Home Office', '1st Floor', 'Office', '12x10', 120, 'not_started', 'Built-in desk, library wall, soundproofing, dedicated circuit', 12000.00, 'not_started', 'Mike Johnson', 'Soundproofing critical for work calls.'),
    ('Laundry Room', '1st Floor', 'Utility', '8x8', 64, 'in_progress', 'Custom cabinets, folding station, utility sink, pet wash', 8000.00, 'in_progress', 'Nicole Taylor', 'Stacked washer/dryer to maximize space.'),
    ('Mudroom', '1st Floor', 'Entry', '6x8', 48, 'not_started', 'Built-in bench, hooks, shoe storage, tile floor', 5500.00, 'not_started', 'Nicole Taylor', 'Heated boot tray. Dog station.'),
    ('Dining Room', '1st Floor', 'Dining', '14x12', 168, 'not_started', 'Wainscoting, chandelier, new floors, paint', 15000.00, 'not_started', 'Lisa Park', 'Statement chandelier needs reinforced ceiling box.'),
    ('Powder Room', '1st Floor', 'Bathroom', '5x6', 30, 'in_progress', 'Wallpaper, vessel sink, brass fixtures, statement mirror', 7500.00, 'in_progress', 'Jessica Lee', 'Special order wallpaper. 4-week lead time.'),
    ('Garage', '1st Floor', 'Garage', '22x20', 440, 'not_started', 'Epoxy floor, cabinets, pegboard, LED lighting, EV charger', 10000.00, 'not_started', 'David Chen', 'EV charger outlet on dedicated 50A circuit.'),
    ('Hallway', '1st Floor', 'Hallway', '30x4', 120, 'not_started', 'Gallery molding, art lighting, new floors', 4500.00, 'not_started', 'Maria Gonzalez', 'Picture frame molding layout pending.'),
    ('Kids Room', '2nd Floor', 'Bedroom', '12x11', 132, 'not_started', 'Built-in bed, study nook, creative storage, chalkboard wall', 9000.00, 'not_started', 'Nicole Taylor', 'Design that grows with child.'),
    ('Guest Bedroom', '2nd Floor', 'Bedroom', '12x12', 144, 'not_started', 'New flooring, paint, closet organization, lighting', 6000.00, 'not_started', 'Maria Gonzalez', 'Minimal renovation. Budget-conscious.'),
    ('Outdoor Patio', 'Exterior', 'Outdoor', '20x16', 320, 'not_started', 'Covered patio extension, lounge area, fire pit', 25000.00, 'not_started', 'Kevin Murphy', 'Requires foundation extension and permit.')
  `);
  console.log('✅ Rooms seeded (15)');

  // Seed punchlist (16)
  await db.query(`
    INSERT INTO punchlist (title, description, room, category, assigned_to, priority, status, due_date, reported_by, notes) VALUES
    ('Cabinet door alignment', 'Upper cabinet doors slightly misaligned on island side', 'Kitchen', 'Carpentry', 'Nicole Taylor', 'medium', 'open', '2025-04-15', 'John Smith', 'Adjust hinges on 3 doors.'),
    ('Grout color mismatch', 'Backsplash grout slightly darker on right section', 'Kitchen', 'Tile', 'Patricia Davis', 'low', 'open', '2025-04-20', 'Lisa Park', 'May need to regrout 4 sqft section.'),
    ('Outlet cover missing', 'Missing outlet cover plate behind refrigerator', 'Kitchen', 'Electrical', 'David Chen', 'low', 'open', '2025-04-10', 'Mike Johnson', 'Standard white decora plate needed.'),
    ('Drywall nail pop', 'Small nail pop visible on living room south wall', 'Living Room', 'Drywall', 'Mike Johnson', 'low', 'open', '2025-04-25', 'John Smith', 'Common after settling. Patch and paint.'),
    ('Door not latching', 'Powder room door not latching properly', 'Powder Room', 'Carpentry', 'Mike Johnson', 'high', 'in_progress', '2025-04-08', 'John Smith', 'Strike plate needs adjustment.'),
    ('Paint touch-up needed', 'Scuff marks on hallway wall from construction traffic', 'Hallway', 'Painting', 'Maria Gonzalez', 'medium', 'open', '2025-06-15', 'Mike Johnson', 'Touch-up with matching paint after all work complete.'),
    ('Caulk gap at tub', 'Small gap in caulk where tub meets tile', 'Master Bath', 'Plumbing', 'Amanda Foster', 'medium', 'open', '2025-05-15', 'Jessica Lee', 'Re-caulk with color-matched silicone.'),
    ('Light switch buzzing', 'Dimmer switch makes faint buzzing sound at low levels', 'Living Room', 'Electrical', 'David Chen', 'medium', 'open', '2025-04-12', 'John Smith', 'May need LED-compatible dimmer upgrade.'),
    ('Floor transition strip', 'Missing transition strip between kitchen tile and living hardwood', 'Kitchen/Living', 'Flooring', 'Thomas Wright', 'high', 'open', '2025-04-30', 'Mike Johnson', 'T-molding profile to match oak color.'),
    ('Window screen torn', 'Small tear in kitchen window screen', 'Kitchen', 'Windows', 'Rachel Kim', 'low', 'open', '2025-05-01', 'John Smith', 'Replace screen in window frame.'),
    ('HVAC register loose', 'Floor register cover loose in master bedroom', 'Primary Bedroom', 'HVAC', 'James Brown', 'low', 'open', '2025-04-20', 'John Smith', 'Needs proper clips for wood floor register.'),
    ('Under-cabinet light gap', 'Gap between under-cabinet light and cabinet on right side', 'Kitchen', 'Electrical', 'David Chen', 'low', 'open', '2025-04-15', 'Lisa Park', 'Add light valance or extend wire.'),
    ('Squeaky floor section', 'Floor squeaks near master bath entry', 'Primary Bedroom', 'Flooring', 'Thomas Wright', 'medium', 'open', '2025-04-25', 'John Smith', 'May need additional subfloor screws.'),
    ('Shower drain slow', 'Master shower drain slightly slow during testing', 'Master Bath', 'Plumbing', 'Amanda Foster', 'high', 'in_progress', '2025-04-10', 'Jessica Lee', 'Check drain assembly. May need p-trap adjustment.'),
    ('Cabinet soft-close not working', 'Two drawer soft-close mechanisms not engaging', 'Kitchen', 'Carpentry', 'Nicole Taylor', 'medium', 'open', '2025-04-15', 'John Smith', 'Drawer slides may need adjustment.'),
    ('Exterior caulk cracking', 'Caulk around new kitchen window showing hairline crack', 'Kitchen', 'Exterior', 'Mike Johnson', 'high', 'open', '2025-04-08', 'John Smith', 'Remove and re-caulk with flexible sealant.')
  `);
  console.log('✅ Punch list seeded (16)');

  // Seed communications (16)
  await db.query(`
    INSERT INTO communications (subject, message, from_name, to_name, comm_type, comm_date, priority, status, related_to, follow_up_date, notes) VALUES
    ('Kitchen cabinets delivery update', 'Hi John, the kitchen cabinets have shipped and are expected to arrive on Feb 25. Please ensure the garage is clear for storage.', 'Nicole Taylor', 'John Smith', 'email', '2025-02-15', 'high', 'resolved', 'Kitchen Renovation', NULL, 'Cabinets arrived on time.'),
    ('Permit approval notification', 'Building permit BP-2024-1001 has been approved. Construction may begin as per approved plans.', 'City of Austin', 'Mike Johnson', 'email', '2025-02-01', 'high', 'resolved', 'Permits', NULL, 'Forwarded to all subs.'),
    ('Change order discussion - insulation', 'Mike, lets discuss upgrading to spray foam insulation while the walls are open. Energy auditor recommends it.', 'John Smith', 'Mike Johnson', 'email', '2025-03-08', 'normal', 'resolved', 'Insulation Upgrade', NULL, 'CO approved after meeting.'),
    ('Weekly progress update #8', 'Week 8 update: Framing complete, rough plumbing 80% done, electrical starting Monday. On schedule.', 'Mike Johnson', 'John Smith', 'email', '2025-03-14', 'normal', 'resolved', 'Project Update', NULL, 'Photos attached in document archive.'),
    ('Tile selection meeting', 'Meeting scheduled for Thursday 2pm at TileArt Studio to finalize backsplash and bathroom tile selections.', 'Lisa Park', 'John Smith', 'meeting', '2025-02-20', 'normal', 'resolved', 'Design Selections', NULL, 'Zellige and large format selected.'),
    ('Appliance delivery coordination', 'Wolf range and Sub-Zero fridge will be delivered Jan 20. Need clear path through garage to kitchen.', 'Ferguson', 'John Smith', 'email', '2025-01-15', 'high', 'resolved', 'Appliance Delivery', NULL, 'Delivered and stored safely.'),
    ('Inspection scheduling - electrical', 'Rough electrical inspection scheduled for March 28. Please have all junction boxes accessible.', 'Sarah Mitchell', 'David Chen', 'phone', '2025-03-25', 'high', 'resolved', 'Inspections', NULL, 'Passed on first attempt.'),
    ('Budget review meeting', 'Monthly budget review meeting scheduled for March 1. Please bring updated actuals and any pending change orders.', 'John Smith', 'Mike Johnson', 'meeting', '2025-02-25', 'normal', 'resolved', 'Budget Review', NULL, 'Budget tracking on target.'),
    ('Window order confirmation', 'Your Andersen 400 series window order (12 units) is confirmed. Expected ship date: April 10.', 'Window Works', 'John Smith', 'email', '2025-03-01', 'normal', 'open', 'Window Order', '2025-04-05', 'Confirm delivery date one week prior.'),
    ('Subfloor moisture issue', 'Found elevated moisture readings under kitchen floor during demo. Recommend remediation before new floor install.', 'Mike Johnson', 'John Smith', 'phone', '2025-02-18', 'urgent', 'resolved', 'Kitchen Floor', NULL, 'Remediation completed. Change order filed.'),
    ('Design revision request', 'John would like to add a pot filler behind the range. Can we route a hot water line during rough-in?', 'Lisa Park', 'Amanda Foster', 'email', '2025-03-05', 'normal', 'resolved', 'Kitchen Design', NULL, 'Added as change order. Installed during rough plumbing.'),
    ('HOA color approval needed', 'Exterior paint colors must be submitted to HOA board for approval before any exterior work begins.', 'HOA Board', 'John Smith', 'letter', '2025-01-10', 'high', 'resolved', 'HOA Requirements', NULL, 'Colors approved with minor adjustment.'),
    ('Warranty registration reminder', 'Please register your Wolf range warranty within 30 days of installation at wolfappliance.com.', 'Ferguson', 'John Smith', 'email', '2025-02-01', 'normal', 'open', 'Warranties', '2025-02-20', 'Need to register all appliance warranties.'),
    ('Schedule adjustment notice', 'Due to backordered tile, bathroom tile work is pushed back 1 week. New start date: May 19.', 'Mike Johnson', 'John Smith', 'email', '2025-04-25', 'high', 'open', 'Schedule', NULL, 'Adjusted timeline. No impact on final date.'),
    ('Noise complaint from neighbor', 'Neighbor at 125 Oak St concerned about early morning construction noise. Please ensure work starts after 8am.', 'John Smith', 'Mike Johnson', 'phone', '2025-03-10', 'high', 'resolved', 'Neighbor Relations', NULL, 'Adjusted start time. Sent apology note.'),
    ('Final walkthrough scheduling', 'Lets schedule the final walkthrough for the first week of July. Please confirm availability.', 'John Smith', 'Mike Johnson', 'email', '2025-06-15', 'normal', 'open', 'Project Closeout', '2025-06-25', 'Need to coordinate with all subs.')
  `);
  console.log('✅ Communications seeded (16)');

  // Seed warranties (16)
  await db.query(`
    INSERT INTO warranties (item_name, category, provider, warranty_type, start_date, expiration_date, coverage_details, claim_process, contact_phone, contact_email, cost, status, notes) VALUES
    ('Wolf 48" Dual Fuel Range', 'Appliances', 'Wolf/Sub-Zero', 'Manufacturer', '2025-01-20', '2027-01-20', 'Full parts and labor coverage. Excludes cosmetic damage.', 'Call 800-222-7820 or visit subzero-wolf.com/warranty', '(800) 222-7820', 'warranty@subzero-wolf.com', 0, 'active', 'Register within 30 days of purchase.'),
    ('Sub-Zero 36" Refrigerator', 'Appliances', 'Wolf/Sub-Zero', 'Manufacturer', '2025-01-20', '2030-01-20', 'Sealed system 12 years. Parts and labor 2 years.', 'Call 800-222-7820 or visit subzero-wolf.com/warranty', '(800) 222-7820', 'warranty@subzero-wolf.com', 0, 'active', '12-year sealed system warranty.'),
    ('Trane AC Unit 3-Ton', 'HVAC', 'Trane', 'Manufacturer', '2025-02-10', '2035-02-10', '10-year compressor warranty. 5-year parts.', 'Contact installing dealer or call Trane support', '(855) 872-6320', 'support@trane.com', 0, 'active', 'Must register within 60 days.'),
    ('Quartz Countertops', 'Countertops', 'Stone Center Austin', 'Manufacturer', '2025-02-25', '2040-02-25', 'Lifetime warranty against defects. Does not cover chips or stains.', 'Contact Stone Center with photos of issue', '(555) 400-0003', 'peter@stonecenter.com', 0, 'active', 'Keep receipt and care guide.'),
    ('Andersen 400 Windows (12)', 'Windows', 'Andersen', 'Manufacturer', '2025-04-15', '2045-04-15', '20-year glass warranty. 10-year hardware. Limited lifetime frame.', 'Visit andersenwindows.com/support or call', '(888) 888-7020', 'warranty@andersenwindows.com', 0, 'active', 'Register each window serial number.'),
    ('Hardwood Flooring', 'Flooring', 'Floor Master', 'Installer', '2025-04-25', '2027-04-25', '2-year installation warranty. Covers gaps, squeaks, and finish defects.', 'Contact Floor Master directly with photos', '(555) 101-0009', 'thomas@floormaster.com', 0, 'active', 'Maintain humidity between 35-55%.'),
    ('Kitchen Cabinetry', 'Cabinetry', 'CustomCabs Inc', 'Manufacturer', '2025-01-25', '2030-01-25', '5-year warranty on construction and finish. Soft-close mechanisms 2 years.', 'Contact Nicole Taylor at CustomCabs', '(555) 101-0014', 'nicole@customcabs.com', 0, 'active', 'Annual hinge adjustment recommended.'),
    ('Spray Foam Insulation', 'Insulation', 'Foam Pro', 'Installer', '2025-03-10', '2035-03-10', 'Lifetime warranty on R-value performance. 10-year adhesion warranty.', 'Contact Foam Pro for inspection', '(555) 400-0014', 'rick@foampro.com', 0, 'active', 'Transferable to new homeowner.'),
    ('Schluter Kerdi Waterproofing', 'Waterproofing', 'Schluter Systems', 'Manufacturer', '2025-04-05', '2035-04-05', 'Lifetime warranty when installed by certified dealer.', 'Submit claim at schluter.com/warranty', '(800) 472-4588', 'warranty@schluter.com', 0, 'active', 'Installer is Schluter certified.'),
    ('Electrical Panel & Wiring', 'Electrical', 'Spark Electric', 'Installer', '2025-03-28', '2027-03-28', '2-year workmanship warranty on all electrical installations.', 'Contact David Chen at Spark Electric', '(555) 101-0003', 'david@sparkelectric.com', 0, 'active', 'Includes smart home wiring.'),
    ('Plumbing Installation', 'Plumbing', 'Flow Plumbing', 'Installer', '2025-03-21', '2027-03-21', '2-year warranty on all plumbing work. Covers leaks and drain issues.', 'Contact Amanda Foster at Flow Plumbing', '(555) 101-0004', 'amanda@flowplumbing.com', 0, 'active', 'Emergency service available 24/7.'),
    ('Bain Ultra Tub', 'Fixtures', 'Bain Ultra', 'Manufacturer', '2025-05-01', '2030-05-01', '5-year warranty on tub shell and jets. 2-year on motor.', 'Call Bain Ultra support with serial number', '(866) 992-2248', 'support@bainultra.com', 0, 'active', 'Use only recommended cleaning products.'),
    ('Lutron Caseta System', 'Electrical', 'Lutron', 'Manufacturer', '2025-03-15', '2030-03-15', '5-year warranty on all Caseta devices and bridge.', 'Visit lutron.com/support or call', '(888) 588-7661', 'support@lutron.com', 0, 'active', 'Firmware updates extend functionality.'),
    ('Ecobee Premium Thermostat', 'Smart Home', 'Ecobee', 'Manufacturer', '2025-03-20', '2028-03-20', '3-year warranty covering defects in materials and workmanship.', 'Contact ecobee support online or by phone', '(877) 932-6233', 'support@ecobee.com', 0, 'active', 'Includes 4 room sensors.'),
    ('Roof Shingles', 'Roofing', 'GAF', 'Manufacturer', '2025-04-01', '2055-04-01', '30-year limited warranty on Timberline HDZ shingles. Wind: 130 mph.', 'File claim at gaf.com/warranty', '(973) 628-3000', 'warranty@gaf.com', 0, 'active', 'Golden Pledge warranty with certified installer.'),
    ('General Workmanship', 'General', 'Mike Johnson GC', 'Contractor', '2025-07-08', '2026-07-08', '1-year general workmanship warranty covering all renovation work.', 'Contact Mike Johnson directly', '(555) 101-0001', 'mike@buildright.com', 0, 'active', 'Industry standard 1-year warranty.')
  `);
  console.log('✅ Warranties seeded (16)');

  // Seed photos (16)
  await db.query(`
    INSERT INTO photos (title, room, phase, description, photo_url, taken_date, tags, notes) VALUES
    ('Kitchen before demo', 'Kitchen', 'before', 'Original kitchen with outdated cabinets and laminate counters', NULL, '2025-01-05', 'kitchen,before,cabinets', 'Documenting existing condition before any work.'),
    ('Kitchen demo complete', 'Kitchen', 'during', 'Kitchen fully gutted - walls, cabinets, flooring removed', NULL, '2025-02-28', 'kitchen,demo,gutted', 'Subfloor water damage discovered during demo.'),
    ('Kitchen cabinets installed', 'Kitchen', 'during', 'White oak shaker cabinets installed on all walls and island', NULL, '2025-05-09', 'kitchen,cabinets,island', 'Soft-close hardware on all doors and drawers.'),
    ('Master bath before', 'Master Bath', 'before', 'Original master bathroom with builder-grade fixtures', NULL, '2025-01-05', 'bathroom,before,fixtures', 'Tile cracking in shower area.'),
    ('Master bath demo', 'Master Bath', 'during', 'Master bathroom stripped to studs', NULL, '2025-02-25', 'bathroom,demo,studs', 'Plumbing reroute needed for new layout.'),
    ('Living room before', 'Living Room', 'before', 'Living room with wall separating from kitchen', NULL, '2025-01-05', 'living,before,wall', 'Load-bearing wall to be removed.'),
    ('Wall removal complete', 'Living Room', 'during', 'Steel beam installed, wall removed, open concept achieved', NULL, '2025-03-07', 'living,beam,open-concept', 'LVL 3.5x14 beam spanning 16 feet.'),
    ('Electrical panel upgrade', 'Utility Room', 'during', 'New 200 amp panel installed and wired', NULL, '2025-03-28', 'electrical,panel,upgrade', '42 circuits. All labeled and documented.'),
    ('Hardwood acclimating', 'Garage', 'during', 'European white oak flooring stacked in garage for acclimation', NULL, '2025-02-15', 'flooring,oak,acclimation', '7-inch wide planks. 2 weeks acclimation required.'),
    ('HVAC installation', 'Utility Room', 'during', 'New Trane 3-ton AC unit installed', NULL, '2025-02-10', 'hvac,trane,installation', 'SEER 18 rating. Ductwork modifications complete.'),
    ('Spray foam insulation', 'Kitchen', 'during', 'Closed cell spray foam applied to exterior walls', NULL, '2025-03-10', 'insulation,spray-foam,walls', 'R-38 achieved. Vapor barrier included.'),
    ('Rough plumbing', 'Kitchen', 'during', 'New plumbing lines run for island sink and dishwasher', NULL, '2025-03-21', 'plumbing,rough-in,island', 'Pressure test passed. Inspector approved.'),
    ('Powder room before', 'Powder Room', 'before', 'Original powder room with pedestal sink', NULL, '2025-01-05', 'powder-room,before,sink', 'Small but functional. Needs modern update.'),
    ('Mudroom before', 'Mudroom', 'before', 'Entry area with no built-in storage', NULL, '2025-01-05', 'mudroom,before,entry', 'Shoes and coats cluttering the entry.'),
    ('Garage before', 'Garage', 'before', 'Unfinished garage with basic lighting', NULL, '2025-01-05', 'garage,before,unfinished', 'No EV charger. Poor organization.'),
    ('Roof overview', 'Exterior', 'before', 'Existing roof with aging asphalt shingles', NULL, '2025-01-06', 'roof,exterior,shingles', 'Multiple areas showing wear. 15+ years old.')
  `);
  console.log('✅ Photos seeded (16)');

  // Seed payments (16)
  await db.query(`
    INSERT INTO payments (payee_name, payment_type, amount, payment_method, payment_date, invoice_number, category, description, status, due_date, notes) VALUES
    ('Mike Johnson GC', 'deposit', 18500.00, 'check', '2025-01-10', 'MJ-2025-001', 'General', 'Initial deposit - 10% of contract value', 'paid', '2025-01-10', 'Contract signed. Project kick-off.'),
    ('Mike Johnson GC', 'progress', 27750.00, 'bank_transfer', '2025-02-28', 'MJ-2025-002', 'General', 'Progress payment #1 - demolition phase complete', 'paid', '2025-03-01', 'Demo completed on schedule.'),
    ('Mike Johnson GC', 'progress', 27750.00, 'bank_transfer', '2025-03-28', 'MJ-2025-003', 'General', 'Progress payment #2 - rough-in phase complete', 'paid', '2025-03-28', 'All rough inspections passed.'),
    ('CustomCabs Inc', 'deposit', 9248.00, 'check', '2025-01-15', 'CC-2025-001', 'Cabinetry', '50% deposit on custom kitchen cabinetry', 'paid', '2025-01-15', '32 cabinet units ordered.'),
    ('CustomCabs Inc', 'final', 9952.00, 'check', '2025-01-25', 'CC-2025-002', 'Cabinetry', 'Final payment on cabinet delivery', 'paid', '2025-01-30', 'Cabinets delivered and inspected.'),
    ('Ferguson Enterprises', 'final', 21500.00, 'credit_card', '2025-01-20', 'FE-2025-001', 'Appliances', 'Wolf range + Sub-Zero refrigerator package', 'paid', '2025-01-20', '2% contractor discount applied.'),
    ('Stone Center Austin', 'deposit', 4250.00, 'check', '2025-02-01', 'SC-2025-001', 'Countertops', '50% deposit on quartz countertop fabrication', 'paid', '2025-02-01', 'Calacatta Laza pattern selected.'),
    ('Stone Center Austin', 'final', 4250.00, 'check', '2025-02-25', 'SC-2025-002', 'Countertops', 'Final payment after countertop installation', 'paid', '2025-02-25', 'Installed with undermount sink cutout.'),
    ('Spark Electric', 'progress', 3500.00, 'bank_transfer', '2025-03-15', 'SE-2025-001', 'Electrical', 'Panel upgrade and rough electrical work', 'paid', '2025-03-15', '200 amp service upgrade complete.'),
    ('Spark Electric', 'progress', 5100.00, 'bank_transfer', '2025-03-28', 'SE-2025-002', 'Electrical', 'Smart home wiring - Cat6 and low voltage', 'paid', '2025-03-28', 'Extra drops added for cameras.'),
    ('Cool Comfort HVAC', 'final', 8200.00, 'check', '2025-02-10', 'CH-2025-001', 'HVAC', 'New Trane 3-ton AC unit supply and install', 'paid', '2025-02-15', 'SEER 18. Rebate application submitted.'),
    ('Foam Pro Insulation', 'final', 5400.00, 'check', '2025-03-10', 'FP-2025-001', 'Insulation', 'Spray foam insulation - all exterior walls', 'paid', '2025-03-10', 'Closed cell R-38. Lifetime warranty.'),
    ('Flow Plumbing', 'progress', 4800.00, 'bank_transfer', '2025-03-21', 'FL-2025-001', 'Plumbing', 'Rough plumbing - kitchen and bathrooms', 'paid', '2025-03-21', 'All lines pressure tested.'),
    ('Window Works Texas', 'deposit', 7000.00, 'check', '2025-03-01', 'WW-2025-001', 'Windows', '50% deposit on 12 Andersen 400 series windows', 'paid', '2025-03-01', 'Triple pane. Expected delivery April 10.'),
    ('Window Works Texas', 'final', 7000.00, 'bank_transfer', NULL, 'WW-2025-002', 'Windows', 'Final payment on window installation', 'pending', '2025-04-30', 'Due upon installation completion.'),
    ('Mike Johnson GC', 'progress', 27750.00, 'bank_transfer', NULL, 'MJ-2025-004', 'General', 'Progress payment #3 - drywall and insulation phase', 'pending', '2025-04-15', 'Due after drywall inspection passes.')
  `);
  console.log('✅ Payments seeded (16)');

  // Seed daily logs (10)
  await db.query(`
    INSERT INTO daily_logs (log_date, weather, temperature, crew_size, hours_worked, work_performed, issues, materials_used, visitor_log, safety_incidents, notes) VALUES
    ('2025-02-17', 'sunny', '62F', 6, 8.0, 'Started demolition of kitchen. Removed upper and lower cabinets, countertops, and backsplash. Disconnected appliances and capped gas line.', 'Found water damage under dishwasher area. Will need subfloor repair.', 'Dumpster (30 yard), pry bars, reciprocating saw, dust barriers', 'Homeowner visited at 10am for walkthrough', NULL, 'Good start to demo. Water damage is a change order.'),
    ('2025-02-18', 'sunny', '65F', 8, 8.5, 'Continued kitchen demo - removed flooring, drywall on exterior wall. Started bathroom demo - removed vanity, toilet, and shower surround.', 'Elevated moisture readings under kitchen floor. Mold remediation recommended.', 'Moisture meter, mold testing kit, PPE masks', 'Mold inspector visited at 2pm', NULL, 'Mold test results pending. Area sealed off.'),
    ('2025-02-28', 'cloudy', '58F', 5, 7.5, 'Completed all demolition. Final cleanup and debris removal. Dumpster pickup scheduled for tomorrow.', NULL, 'Cleanup supplies, shop vac, brooms', NULL, NULL, 'Demo phase complete. Ready for structural work.'),
    ('2025-03-03', 'sunny', '68F', 4, 8.0, 'Started structural work. Installed temporary shoring for load-bearing wall removal. Marked beam locations per engineering plans.', NULL, 'Temporary posts, 4x4 lumber, structural screws', 'Structural engineer Steven Anderson on site for beam placement', NULL, 'Shoring solid. Ready for beam installation tomorrow.'),
    ('2025-03-07', 'sunny', '72F', 6, 9.0, 'Installed steel LVL beam (3.5x14, 16ft span). Connected beam to posts with Simpson Strong-Tie connectors. Removed temporary shoring.', NULL, 'Steel LVL beam, Simpson connectors, lag bolts', 'Inspector Tom Richards - passed structural inspection', NULL, 'Beam installed and inspected. Major milestone complete!'),
    ('2025-03-10', 'rainy', '55F', 5, 7.0, 'Started rough plumbing. Ran new supply lines for kitchen island sink. Began bathroom plumbing reroute per new layout.', 'Rain delayed exterior work. Focused on interior plumbing.', 'Copper pipe, PEX tubing, fittings, solder', NULL, NULL, 'Indoor work only today due to weather.'),
    ('2025-03-15', 'sunny', '70F', 7, 8.5, 'Electrical panel upgrade to 200 amp. Ran new circuits for kitchen appliances. Started smart home pre-wire with Cat6.', NULL, '200A panel, copper wire (various gauges), Cat6 cable, junction boxes', 'David Chen (electrician) and crew of 3', NULL, 'Major electrical work day. 42 new circuits planned.'),
    ('2025-03-21', 'cloudy', '63F', 4, 8.0, 'Completed rough plumbing. All supply and drain lines installed. Pressure test passed at 80 PSI for 30 minutes.', NULL, 'Test gauge, pipe fittings, drain assemblies', 'Inspector Mark Johnson - passed plumbing rough inspection', NULL, 'Plumbing rough-in complete and inspected.'),
    ('2025-03-28', 'sunny', '75F', 6, 8.0, 'Completed rough electrical. All circuits wired, panel connected. Smart home wiring complete with extra camera drops.', NULL, 'Wire, switches, outlet boxes, smart home hub', 'Inspector Sarah Mitchell - passed electrical rough inspection', NULL, 'All rough-in inspections now passed. Ready for insulation.'),
    ('2025-03-31', 'windy', '67F', 5, 7.5, 'Started insulation and drywall phase. Spray foam insulation applied to all exterior walls. Vapor barrier verified.', 'High winds made outdoor staging difficult.', 'Spray foam insulation, protective sheeting, PPE', 'Foam Pro crew (3 people) for spray foam application', NULL, 'Insulation complete. Drywall delivery scheduled for tomorrow.')
  `);
  console.log('✅ Daily logs seeded (10)');

  console.log('\n🎉 Database seeding complete!');
  console.log('📧 Demo login: john@example.com / password123');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
