export interface SpecialtyType {
  title: string
  desc: string
}

export interface SpecialtyFaq {
  q: string
  a: string
}

export interface Specialty {
  slug: string
  label: string
  sub: string
  tagline: string
  heroGradient: string
  accentColor: string
  intro: string
  whenRecommended: string[]
  conditionsTreated: string[]
  types: SpecialtyType[]
  benefits: string[]
  recovery: string[]
  risks: string[]
  faqs: SpecialtyFaq[]
}

export const specialties: Specialty[] = [
  {
    slug: 'knee-replacement',
    label: 'Knee Replacement',
    sub: 'Robotic precision',
    tagline: 'Regain Mobility. Live Pain-Free.',
    heroGradient: 'linear-gradient(135deg,#d4edaa 0%,#a8d8b0 50%,#6fbfae 100%)',
    accentColor: '#2E8B6E',
    intro: 'Knee Replacement Surgery, also known as Total Knee Arthroplasty (TKA), is a highly successful orthopedic procedure designed to relieve chronic knee pain, improve mobility, and restore quality of life. It is commonly recommended for patients suffering from severe arthritis, joint damage, or long-term knee degeneration that no longer responds to non-surgical treatments. The knee joint is formed by the femur (thigh bone), tibia (shin bone), and patella (kneecap). During surgery, the damaged portions of the joint are removed and replaced with specially designed artificial implants made from medical-grade metal and durable plastic.',
    whenRecommended: [
      'Persistent knee pain during daily activities',
      'Difficulty walking, climbing stairs, or standing for long periods',
      'Severe stiffness or reduced range of motion',
      'Knee deformity or misalignment',
      'Pain that continues even while resting',
      'Limited relief from medications, injections, or physiotherapy',
    ],
    conditionsTreated: [
      'Osteoarthritis',
      'Rheumatoid Arthritis',
      'Post-Traumatic Arthritis',
      'Degenerative Joint Disease',
      'Severe Cartilage Damage',
      'Advanced Knee Deformities',
    ],
    types: [
      {
        title: 'Total Knee Replacement (TKR)',
        desc: 'The entire knee joint surface is replaced with artificial components. This is the most commonly performed knee replacement procedure.',
      },
      {
        title: 'Partial Knee Replacement (PKR)',
        desc: 'Only the damaged section of the knee is replaced while preserving healthy bone and tissue. Suitable for selected patients with localized arthritis.',
      },
    ],
    benefits: [
      'Significant reduction in pain',
      'Improved joint function and flexibility',
      'Better mobility and independence',
      'Enhanced quality of life',
      'Long-lasting results — implants often last 15–20 years',
    ],
    recovery: [
      'Most patients begin walking with assistance within 24 hours after surgery',
      'Hospital stay generally ranges from 2 to 5 days',
      'Physiotherapy begins early to restore muscle strength and flexibility',
      'Most patients return to daily activities within a few weeks',
      'Full recovery continues for several months with follow-up care',
    ],
    risks: [
      'Infection',
      'Blood clots',
      'Implant loosening over time',
      'Nerve or blood vessel injury',
      'Joint stiffness',
    ],
    faqs: [
      { q: 'How long does a knee replacement last?', a: 'Most modern knee replacements last between 15 and 20 years, and often longer with proper care and regular follow-up.' },
      { q: 'Will I be able to walk normally again?', a: 'Yes. Most patients experience substantial improvements in walking, mobility, and overall function after recovery.' },
      { q: 'Is knee replacement surgery painful?', a: 'Pain is carefully managed with modern anesthesia techniques. Most patients report significant pain relief once recovery is complete.' },
      { q: 'When can I return to normal activities?', a: 'Many patients return to routine daily activities within a few weeks, while full recovery may continue for several months.' },
      { q: 'Will I need physiotherapy after surgery?', a: 'Yes. Physiotherapy plays a crucial role in achieving the best possible outcome and restoring full knee function.' },
    ],
  },
  {
    slug: 'hip-replacement',
    label: 'Hip Replacement',
    sub: 'Minimally invasive',
    tagline: 'Move Freely. Live Actively.',
    heroGradient: 'linear-gradient(135deg,#fde8cf 0%,#f9c89e 50%,#e8a07a 100%)',
    accentColor: '#C06030',
    intro: 'Hip Replacement Surgery, also known as Total Hip Arthroplasty (THA), is a highly successful orthopedic procedure used to relieve chronic hip pain and restore joint function when non-surgical treatments are no longer effective. The procedure involves replacing damaged parts of the hip joint — where the femoral head fits into the acetabulum — with artificial components made from medical-grade metal, ceramic, or durable plastic, allowing smooth pain-free movement.',
    whenRecommended: [
      'Persistent hip pain that limits daily activities',
      'Difficulty walking, climbing stairs, or standing',
      'Hip stiffness affecting movement',
      'Pain during rest or sleep',
      'Reduced quality of life due to hip discomfort',
      'Failure of medications, physiotherapy, injections, or other conservative treatments',
    ],
    conditionsTreated: [
      'Osteoarthritis',
      'Rheumatoid Arthritis',
      'Avascular Necrosis (AVN)',
      'Hip Fractures',
      'Post-Traumatic Arthritis',
      'Congenital Hip Disorders',
    ],
    types: [
      {
        title: 'Total Hip Replacement (THR)',
        desc: 'Both the ball and socket portions of the hip joint are replaced. Best for advanced arthritis, severe joint damage, and long-term pain and disability.',
      },
      {
        title: 'Partial Hip Replacement',
        desc: 'Only the damaged femoral head is replaced. Usually recommended for certain hip fractures and selected elderly patients.',
      },
      {
        title: 'Revision Hip Replacement',
        desc: 'Performed when a previous hip replacement requires correction or replacement due to wear, loosening, or complications.',
      },
    ],
    benefits: [
      'Significant reduction or elimination of chronic hip pain',
      'Improved mobility — walking, climbing stairs, and daily activities become easier',
      'Better sleep quality once chronic pain is relieved',
      'Improved independence and participation in social activities',
      'Long-term results — modern implants often last 15–25 years or longer',
    ],
    recovery: [
      'Patients are encouraged to begin walking with assistance shortly after surgery',
      'Hospital stay of 2–5 days depending on recovery progress',
      'Walking aids used for the first few weeks as advised',
      'Structured physiotherapy program to restore strength, mobility, and balance',
      'Most patients return to routine daily activities within several weeks; full recovery within 3–6 months',
    ],
    risks: [
      'Infection',
      'Blood clots',
      'Nerve injury',
      'Implant loosening or wear over time',
      'Joint dislocation',
      'Leg length differences',
      'Fracture around the implant',
    ],
    faqs: [
      { q: 'How long does a hip replacement last?', a: 'Most modern implants last 15–25 years or longer depending on activity level and overall health.' },
      { q: 'When can I walk after surgery?', a: 'Many patients begin standing and walking with assistance within 24 hours of surgery.' },
      { q: 'Will I need physiotherapy?', a: 'Yes. Physiotherapy is an essential part of successful recovery, helping restore strength, mobility, and balance.' },
      { q: 'Can I return to normal activities?', a: 'Most patients return to routine daily activities within several weeks, although complete recovery may take several months.' },
      { q: 'Is hip replacement painful?', a: 'Pain is managed using modern anesthesia techniques and rehabilitation programs. Most patients experience significant long-term pain relief.' },
    ],
  },
  {
    slug: 'spine-surgery',
    label: 'Spine Surgery',
    sub: 'Advanced techniques',
    tagline: 'Restore Strength. Reclaim Your Life.',
    heroGradient: 'linear-gradient(135deg,#fde2c8 0%,#f8bfa0 50%,#e89a78 100%)',
    accentColor: '#B85030',
    intro: 'Spine Surgery encompasses a range of advanced procedures designed to treat conditions causing back pain, nerve compression, and spinal instability. Our expert spine surgeons use the latest minimally invasive and robotic-assisted techniques to achieve precision results with minimal disruption to surrounding tissues, faster recovery, and reduced post-operative discomfort.',
    whenRecommended: [
      'Severe back or neck pain unresponsive to conservative treatment',
      'Numbness, tingling, or weakness in arms or legs',
      'Difficulty walking or maintaining balance',
      'Loss of bladder or bowel control (urgent)',
      'Spinal deformity or progressive curvature',
      'Spinal cord compression confirmed on MRI or CT scan',
    ],
    conditionsTreated: [
      'Herniated or Slipped Disc',
      'Spinal Stenosis',
      'Spondylolisthesis',
      'Degenerative Disc Disease',
      'Scoliosis',
      'Spinal Fractures',
    ],
    types: [
      {
        title: 'Minimally Invasive Spine Surgery (MISS)',
        desc: 'Uses small incisions and specialized instruments to reduce muscle damage and speed recovery while achieving the same outcomes as open surgery.',
      },
      {
        title: 'Spinal Fusion',
        desc: 'Two or more vertebrae are permanently joined to eliminate painful motion at that segment, stabilizing the spine.',
      },
    ],
    benefits: [
      'Relief from chronic back and neck pain',
      'Restored nerve function and sensation',
      'Improved posture and spinal alignment',
      'Greater mobility and independence',
      'Minimally invasive options mean faster recovery',
    ],
    recovery: [
      'Most patients are mobile within 24–48 hours of surgery',
      'Hospital stay ranges from 1 to 5 days depending on procedure',
      'Physical therapy begins early to strengthen supporting muscles',
      'Return to desk work within 2–6 weeks for most procedures',
      'Full recovery varies from 3 months to 1 year depending on surgery type',
    ],
    risks: [
      'Infection',
      'Nerve damage',
      'Blood clots',
      'Adjacent segment disease',
      'Hardware failure (rare)',
    ],
    faqs: [
      { q: 'Is spine surgery always necessary?', a: 'No. Most spine conditions improve with conservative treatment. Surgery is recommended only when non-surgical options have failed or when there is nerve compression.' },
      { q: 'How long does recovery take?', a: 'Recovery varies by procedure — from 2–4 weeks for minimally invasive procedures to several months for complex spinal fusions.' },
      { q: 'Will I need physiotherapy after surgery?', a: 'Yes. A structured rehabilitation program is essential for optimal outcomes and long-term spine health.' },
    ],
  },
  {
    slug: 'sports-medicine',
    label: 'Sports Medicine',
    sub: 'Return to play',
    tagline: 'Recover Faster. Perform Better.',
    heroGradient: 'linear-gradient(135deg,#c4f0d8 0%,#90dab8 50%,#56b898 100%)',
    accentColor: '#1A8060',
    intro: 'Sports Medicine at Navajeevana Ortho Hospitals offers comprehensive diagnosis, treatment, and rehabilitation for sports-related injuries and musculoskeletal conditions. Whether you are a professional athlete or a weekend sports enthusiast, our sports medicine specialists are dedicated to getting you back to peak performance safely and efficiently.',
    whenRecommended: [
      'Acute sports injuries (sprains, strains, fractures)',
      'Ligament tears (ACL, PCL, MCL)',
      'Tendon injuries (rotator cuff, Achilles)',
      'Stress fractures from repetitive activity',
      'Joint pain or instability affecting sports performance',
      'Overuse injuries requiring structured rehabilitation',
    ],
    conditionsTreated: [
      'ACL / PCL Tears',
      'Meniscal Injuries',
      'Rotator Cuff Tears',
      'Tennis & Golfer\'s Elbow',
      'Achilles Tendon Injuries',
      'Stress Fractures',
    ],
    types: [
      {
        title: 'Arthroscopic Surgery',
        desc: 'Minimally invasive keyhole procedure to diagnose and treat joint injuries with faster recovery and minimal scarring.',
      },
      {
        title: 'Ligament Reconstruction',
        desc: 'Surgical repair or reconstruction of torn ligaments (e.g. ACL reconstruction) to restore joint stability and function.',
      },
    ],
    benefits: [
      'Faster return to sport and physical activity',
      'Personalized treatment for athletes at all levels',
      'Minimally invasive surgical options',
      'Comprehensive sports-specific rehabilitation',
      'Injury prevention programs',
    ],
    recovery: [
      'Initial rest, ice, compression, and elevation (RICE protocol)',
      'Physiotherapy begins within days to maintain fitness and strength',
      'Sport-specific rehabilitation phases customized for each patient',
      'Return-to-play clearance based on functional assessment, not just time',
      'Injury prevention strategies provided before discharge',
    ],
    risks: [
      'Re-injury if rehabilitation is incomplete',
      'Infection (surgical cases)',
      'Stiffness or reduced range of motion',
      'Nerve or vessel injury (rare)',
    ],
    faqs: [
      { q: 'How soon can I return to sport after ACL surgery?', a: 'Most athletes return to sport 9–12 months after ACL reconstruction, following a structured rehabilitation program.' },
      { q: 'Can sports injuries be treated without surgery?', a: 'Many sports injuries respond well to physiotherapy, PRP injections, and bracing. Surgery is reserved for cases where conservative treatment has failed.' },
      { q: 'Do you treat recreational athletes or only professionals?', a: 'We treat athletes at all levels — from school sports players to elite professionals.' },
    ],
  },
  {
    slug: 'trauma-care',
    label: 'Trauma Care',
    sub: '24/7 emergency',
    tagline: 'Expert Care When It Matters Most.',
    heroGradient: 'linear-gradient(135deg,#e8dcff 0%,#c8a8f0 50%,#9c78d8 100%)',
    accentColor: '#6040B0',
    intro: 'Our 24/7 Orthopedic Trauma Care unit is equipped to handle the full spectrum of musculoskeletal injuries — from simple fractures to complex multi-trauma cases. Our trauma team combines immediate emergency care with advanced surgical expertise to ensure the best outcomes for patients at any hour of the day or night.',
    whenRecommended: [
      'Acute fractures following falls, accidents, or sports injuries',
      'Joint dislocations requiring immediate reduction',
      'Open (compound) fractures',
      'Pelvic or acetabular fractures',
      'Multiple trauma with musculoskeletal involvement',
      'Post-accident rehabilitation and reconstruction',
    ],
    conditionsTreated: [
      'Simple and Complex Fractures',
      'Joint Dislocations',
      'Open / Compound Fractures',
      'Pelvic Ring Injuries',
      'Spinal Trauma',
      'Soft Tissue Injuries',
    ],
    types: [
      {
        title: 'Closed Reduction & Casting',
        desc: 'Non-surgical realignment of fractured bones followed by immobilization in a cast or splint for appropriate fracture types.',
      },
      {
        title: 'Open Reduction Internal Fixation (ORIF)',
        desc: 'Surgical realignment and internal stabilization of complex fractures using plates, screws, or intramedullary nails.',
      },
    ],
    benefits: [
      'Immediate 24/7 emergency orthopaedic response',
      'Advanced imaging for rapid diagnosis',
      'Modern fixation techniques for precise bone alignment',
      'Minimized long-term complications',
      'Integrated rehabilitation from day one',
    ],
    recovery: [
      'Emergency stabilization and pain control on arrival',
      'Surgery performed as urgently as required',
      'Early mobilization to prevent complications',
      'Physiotherapy initiated as soon as medically safe',
      'Regular follow-up to monitor healing and alignment',
    ],
    risks: [
      'Malunion or nonunion of fractures',
      'Infection (especially in open fractures)',
      'Compartment syndrome',
      'Post-traumatic arthritis',
      'Nerve or vascular injury',
    ],
    faqs: [
      { q: 'Is your trauma unit available 24 hours?', a: 'Yes. Our orthopedic trauma team is available 24 hours a day, 7 days a week for emergency cases.' },
      { q: 'How quickly can I be seen after an injury?', a: 'Emergency trauma cases are triaged immediately on arrival. Our team aims to assess and stabilize all patients within the first hour.' },
      { q: 'Will I need surgery for a fracture?', a: 'Not all fractures require surgery. Our specialists determine the best treatment — casting, bracing, or surgery — based on fracture type, location, and patient factors.' },
    ],
  },
  {
    slug: 'physiotherapy',
    label: 'Physiotherapy & Rehab',
    sub: 'Faster recovery',
    tagline: 'Heal Completely. Move Confidently.',
    heroGradient: 'linear-gradient(135deg,#b8f0dc 0%,#80d8b8 50%,#50b898 100%)',
    accentColor: '#1A7860',
    intro: 'Our Physiotherapy and Rehabilitation Centre offers evidence-based treatment programs designed to restore function, reduce pain, and prevent re-injury. Whether recovering from surgery, managing a chronic condition, or seeking performance enhancement, our experienced physiotherapists deliver individualized care in a state-of-the-art facility.',
    whenRecommended: [
      'Post-surgical rehabilitation (joint replacement, spine, sports)',
      'Chronic joint or muscle pain',
      'Sports injuries and performance recovery',
      'Neurological rehabilitation',
      'Work-related or postural musculoskeletal problems',
      'Balance and gait disorders in elderly patients',
    ],
    conditionsTreated: [
      'Post-Operative Rehabilitation',
      'Neck and Back Pain',
      'Frozen Shoulder',
      'Sciatica and Nerve Pain',
      'Osteoporosis Management',
      'Balance & Fall Prevention',
    ],
    types: [
      {
        title: 'Manual Therapy',
        desc: 'Hands-on techniques including joint mobilization, massage, and manipulation to reduce pain and restore movement.',
      },
      {
        title: 'Therapeutic Exercise',
        desc: 'Individualized exercise programs to rebuild strength, flexibility, balance, and endurance tailored to each patient\'s goals.',
      },
    ],
    benefits: [
      'Faster recovery after surgery or injury',
      'Reduction in chronic pain without medication',
      'Improved strength, flexibility, and coordination',
      'Reduced risk of future injury',
      'Personalized programs for all ages and fitness levels',
    ],
    recovery: [
      'Initial assessment and goal-setting with your physiotherapist',
      'Customized treatment program designed for your specific needs',
      'Regular sessions combining manual therapy and targeted exercise',
      'Progress reviews with adjustments to the program as you improve',
      'Home exercise plan provided to support recovery between sessions',
    ],
    risks: [
      'Temporary soreness after treatment sessions (normal and expected)',
      'Delayed recovery if exercises are not followed consistently',
    ],
    faqs: [
      { q: 'How many physiotherapy sessions will I need?', a: 'This depends on your condition and goals. Most patients see significant improvement within 6–12 sessions, though complex cases may require longer programs.' },
      { q: 'Is physiotherapy painful?', a: 'Some discomfort during treatment is normal, particularly in the early stages. Your physiotherapist will adjust intensity to your comfort level.' },
      { q: 'Can physiotherapy replace surgery?', a: 'In many cases, physiotherapy can effectively treat musculoskeletal conditions and reduce or eliminate the need for surgery.' },
      { q: 'Do I need a doctor\'s referral?', a: 'Not always. You can consult our physiotherapy team directly. However, a referral is recommended after surgery.' },
    ],
  },
]

export function getSpecialty(slug: string): Specialty | undefined {
  return specialties.find(s => s.slug === slug)
}
