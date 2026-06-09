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
    tagline: 'Relieve Pain. Restore Function. Return to Life.',
    heroGradient: 'linear-gradient(135deg,#fde2c8 0%,#f8bfa0 50%,#e89a78 100%)',
    accentColor: '#B85030',
    intro: 'Spine surgery is performed to treat conditions affecting the neck, upper back, lower back, spinal nerves, and spinal cord when conservative treatments such as medications, physiotherapy, injections, and lifestyle modifications have not provided sufficient relief. Modern spine surgery techniques, including minimally invasive procedures, allow many patients to recover faster with less pain and smaller incisions.',
    whenRecommended: [
      'Severe back or neck pain that persists despite conservative treatment',
      'Numbness or weakness developing in the arms or legs',
      'Walking becomes difficult due to nerve compression',
      'Spinal instability or progressive neurological deficits',
      'Conservative treatments have failed to provide relief',
      'Quality of life is significantly affected by spinal problems',
    ],
    conditionsTreated: [
      'Herniated Disc (Slipped Disc)',
      'Spinal Stenosis',
      'Degenerative Disc Disease',
      'Sciatica',
      'Scoliosis',
      'Spinal Fractures',
      'Spondylolisthesis',
      'Spinal Tumors',
    ],
    types: [
      {
        title: 'Microdiscectomy',
        desc: 'Removal of a portion of a herniated disc that is compressing a nerve. Best for sciatica, herniated discs, and nerve compression.',
      },
      {
        title: 'Laminectomy',
        desc: 'Removal of part of the vertebral bone to relieve pressure on nerves. Best for spinal stenosis and nerve compression.',
      },
      {
        title: 'Spinal Fusion',
        desc: 'Two or more vertebrae are permanently joined together to improve stability. Best for spinal instability, spondylolisthesis, and severe degenerative conditions.',
      },
      {
        title: 'Artificial Disc Replacement',
        desc: 'Damaged discs are replaced with artificial implants while preserving motion. Best for selected degenerative disc disease patients.',
      },
      {
        title: 'Minimally Invasive Spine Surgery',
        desc: 'Performed through small incisions with less muscle damage and faster recovery — smaller scars, reduced blood loss, and shorter hospital stay.',
      },
    ],
    benefits: [
      'Significant pain relief from chronic back or neck pain',
      'Improved mobility — walking, sitting, and daily activities become easier',
      'Better nerve function — numbness, tingling, and weakness may improve',
      'Improved quality of life and return to work, hobbies, and social activities',
      'Reduced dependence on pain medications',
      'Long-term improvement — many procedures provide durable results',
    ],
    recovery: [
      'Most patients begin walking shortly after surgery under medical supervision',
      'Walking regularly improves circulation, prevents blood clots, and promotes healing',
      'Physiotherapy helps improve strength, flexibility, mobility, and balance',
      'Desk job workers may return to work within a few weeks of surgery',
      'Follow prescribed exercises, maintain good posture, and attend all follow-up appointments',
    ],
    risks: [
      'Infection',
      'Blood clots',
      'Nerve damage',
      'Temporary activity restrictions during recovery',
      'Variable recovery time depending on age, health, and procedure type',
      'Some patients may require additional treatment later',
    ],
    faqs: [
      { q: 'How long does recovery take?', a: 'Recovery varies depending on the procedure. Many patients improve significantly within weeks, while complete recovery may take several months.' },
      { q: 'Will I need physiotherapy?', a: 'Yes. Physiotherapy is often an important part of recovery, helping to restore strength, flexibility, and mobility.' },
      { q: 'Can spine surgery completely eliminate pain?', a: 'Many patients experience significant pain relief, but outcomes vary based on the condition being treated and the procedure performed.' },
      { q: 'When can I drive after surgery?', a: 'Driving should only be resumed after approval from your surgeon. Timeline depends on the procedure and your recovery progress.' },
      { q: 'Will I be able to exercise again?', a: 'Most patients gradually return to exercise after healing and rehabilitation, guided by their surgeon and physiotherapist.' },
    ],
  },
  {
    slug: 'sports-medicine',
    label: 'Sports Medicine',
    sub: 'Return to play',
    tagline: 'Recover Stronger. Move Better. Perform Your Best.',
    heroGradient: 'linear-gradient(135deg,#c4f0d8 0%,#90dab8 50%,#56b898 100%)',
    accentColor: '#1A8060',
    intro: 'Sports Medicine is a specialized branch of orthopedics focused on the prevention, diagnosis, treatment, rehabilitation, and performance optimization of sports and exercise-related injuries. Whether you are a professional athlete, amateur player, fitness enthusiast, or someone who enjoys an active lifestyle, our Sports Medicine team helps you recover safely and return to the activities you love — combining orthopedic expertise, physiotherapy, rehabilitation, biomechanics, and injury prevention strategies.',
    whenRecommended: [
      'Persistent pain, swelling, or joint instability after injury',
      'Difficulty walking or reduced range of motion',
      'Ligament tears (ACL, PCL, MCL) or meniscus injuries',
      'Tendon injuries from overuse — Achilles, rotator cuff, patellar',
      'Stress fractures from repetitive loading',
      'Recurrent injuries or joint locking and clicking sensations',
    ],
    conditionsTreated: [
      'ACL / PCL / MCL Tears',
      'Meniscus Tears',
      'Rotator Cuff Injuries',
      'Tennis & Golfer\'s Elbow',
      'Achilles & Patellar Tendonitis',
      'Stress Fractures',
      'Ankle Sprains',
      'Shoulder Dislocations',
    ],
    types: [
      {
        title: 'ACL Reconstruction',
        desc: 'Surgical reconstruction for complete ACL tears, restoring knee stability and enabling return to sport.',
      },
      {
        title: 'Meniscus Repair',
        desc: 'Repair of damaged knee cartilage to restore normal joint function and prevent long-term arthritis.',
      },
      {
        title: 'Rotator Cuff Repair',
        desc: 'Surgical repair for significant rotator cuff tendon tears, restoring shoulder strength and mobility.',
      },
      {
        title: 'Shoulder Stabilization Surgery',
        desc: 'Procedure for recurrent shoulder dislocations to prevent future instability.',
      },
      {
        title: 'Arthroscopic Surgery',
        desc: 'Minimally invasive keyhole procedures using a camera and small incisions — faster recovery and minimal scarring for a range of joint injuries.',
      },
    ],
    benefits: [
      'Faster recovery and safe return to sports and physical activity',
      'Personalized treatment for athletes at all levels — professional to recreational',
      'Minimally invasive surgical options with less downtime',
      'Comprehensive sports-specific rehabilitation programs',
      'Injury prevention strategies to reduce risk of future injuries',
      'Improved athletic performance and long-term joint health',
    ],
    recovery: [
      'Initial RICE approach — Rest, Ice, Compression, Elevation to manage early swelling',
      'Physiotherapy begins within days to maintain fitness and restore strength',
      'Sports rehabilitation program individualized based on the injury and sport',
      'Return-to-sport assessment based on functional testing — not just time alone',
      'Home exercise plan and injury prevention strategies provided before discharge',
    ],
    risks: [
      'Re-injury if rehabilitation is incomplete or return to sport is rushed',
      'Infection (surgical cases)',
      'Stiffness or reduced range of motion',
      'Nerve or blood vessel injury (rare)',
    ],
    faqs: [
      { q: 'Is Sports Medicine only for athletes?', a: 'No. Sports Medicine benefits anyone experiencing exercise-related or musculoskeletal injuries — from professional athletes to active adults and fitness enthusiasts.' },
      { q: 'Can sports injuries heal without surgery?', a: 'Many injuries respond successfully to non-surgical treatment including physiotherapy, bracing, and rehabilitation. Surgery is reserved for cases where conservative treatment has failed.' },
      { q: 'How long does recovery take?', a: 'Recovery depends on the injury type, severity, and treatment method. Minor injuries may resolve in weeks; ligament reconstructions may take 9–12 months for full return to sport.' },
      { q: 'When can I return to sports?', a: 'Return-to-sport decisions are individualized and based on recovery progress and functional testing — not just time. Our team clears you when it is safe to do so.' },
      { q: 'Can sports injuries be prevented?', a: 'Many injuries can be prevented through proper training, conditioning, warm-up routines, biomechanical assessment, and sports-specific injury prevention programs.' },
    ],
  },
  {
    slug: 'trauma-care',
    label: 'Trauma Care',
    sub: '24/7 emergency',
    tagline: 'Expert Care for Broken Bones, Accidents, and Orthopedic Emergencies.',
    heroGradient: 'linear-gradient(135deg,#e8dcff 0%,#c8a8f0 50%,#9c78d8 100%)',
    accentColor: '#6040B0',
    intro: 'Fracture and Trauma Care is a specialized orthopedic service focused on the diagnosis, emergency treatment, surgical management, and rehabilitation of bone fractures and musculoskeletal injuries caused by accidents, falls, sports injuries, workplace incidents, and trauma. Our goal is to provide timely treatment, restore function, reduce pain, and help patients return safely to their normal activities.',
    whenRecommended: [
      'Severe pain, swelling, bruising, or visible deformity after injury',
      'Inability to bear weight or move the injured limb',
      'Open (compound) fractures — bone visible through skin',
      'Fractures following falls, road accidents, or high-impact trauma',
      'Pelvic, femur, or spinal fractures requiring urgent stabilization',
      'Numbness, tingling, or loss of circulation near the injury site',
    ],
    conditionsTreated: [
      'Wrist, Arm & Shoulder Fractures',
      'Hip & Femur Fractures',
      'Pelvic Fractures',
      'Knee & Leg Fractures',
      'Ankle & Foot Fractures',
      'Spine Fractures',
      'Open (Compound) Fractures',
      'Stress & Compression Fractures',
    ],
    types: [
      {
        title: 'Casting & Splinting',
        desc: 'Immobilizes the bone while it heals — used for stable, non-displaced fractures. Casting maintains proper alignment throughout the healing period.',
      },
      {
        title: 'Internal Fixation',
        desc: 'Surgeon uses plates, screws, rods, or nails to stabilize the fracture internally while healing occurs. Used for displaced, unstable, or joint fractures.',
      },
      {
        title: 'Open Reduction & Internal Fixation (ORIF)',
        desc: 'Surgical realignment of broken bones followed by internal stabilization with metal implants. Commonly performed for complex fractures.',
      },
      {
        title: 'External Fixation',
        desc: 'A stabilizing frame outside the body connected to the bone through pins — often used for severe trauma, open fractures, and complex injuries.',
      },
    ],
    benefits: [
      'Immediate 24/7 emergency orthopedic response',
      'Advanced imaging (X-ray, CT, MRI) for rapid and accurate diagnosis',
      'Modern fixation techniques for precise bone alignment',
      'Comprehensive rehabilitation to restore strength and mobility',
      'Minimized long-term complications with early expert treatment',
    ],
    recovery: [
      'Emergency stabilization and pain control on arrival',
      'Surgery performed as urgently as required for unstable fractures',
      'Physiotherapy initiated as soon as medically safe to restore movement and strength',
      'Use walking aids (crutches, walkers) as instructed until cleared for full weight-bearing',
      'Regular follow-up appointments to monitor bone healing and alignment',
    ],
    risks: [
      'Infection (especially in open fractures)',
      'Delayed healing or nonunion (failure to heal)',
      'Malunion (healing in an incorrect position)',
      'Joint stiffness and chronic pain',
      'Nerve or blood vessel injury',
      'Blood clots during recovery',
    ],
    faqs: [
      { q: 'How long does a fracture take to heal?', a: 'Most fractures heal within several weeks to months depending on the injury type, location, patient age, and overall health.' },
      { q: 'Will I need surgery for a fracture?', a: 'Not all fractures require surgery. Treatment depends on fracture type and stability — our specialists determine whether casting, bracing, or surgery is appropriate.' },
      { q: 'When can I walk again?', a: 'Weight-bearing recommendations vary depending on the injury and treatment plan. Your orthopedic surgeon will guide you on safe return to walking.' },
      { q: 'Is physiotherapy necessary?', a: 'In many cases physiotherapy is essential for restoring strength, mobility, and function after a fracture. Rehabilitation helps prevent stiffness and improves long-term outcomes.' },
      { q: 'Can fractures heal completely?', a: 'Many fractures heal successfully with proper treatment and rehabilitation. Early diagnosis and following your treatment plan are key to a full recovery.' },
    ],
  },
  {
    slug: 'physiotherapy',
    label: 'Physiotherapy & Rehab',
    sub: 'Faster recovery',
    tagline: 'Restore Movement. Rebuild Strength. Return to Life.',
    heroGradient: 'linear-gradient(135deg,#b8f0dc 0%,#80d8b8 50%,#50b898 100%)',
    accentColor: '#1A7860',
    intro: 'Physiotherapy and Rehabilitation are essential components of orthopedic care that help patients recover from injuries, surgeries, fractures, joint replacements, sports injuries, spine conditions, and chronic musculoskeletal disorders. Our goal is not only to reduce pain but also to restore mobility, improve strength, enhance function, and help patients return safely to their normal daily activities — using evidence-based techniques including therapeutic exercises, manual therapy, balance training, and functional rehabilitation.',
    whenRecommended: [
      'Post-surgical rehabilitation — knee/hip replacement, spine, fracture surgery',
      'Chronic joint or muscle pain affecting daily life',
      'Sports injuries and performance recovery',
      'Back pain, neck pain, and disc-related problems',
      'Balance problems and fall prevention in elderly patients',
      'Work-related or postural musculoskeletal problems',
    ],
    conditionsTreated: [
      'Knee, Hip & Shoulder Pain',
      'Back & Neck Pain',
      'Frozen Shoulder',
      'Sciatica & Nerve Pain',
      'Post-Fracture Recovery',
      'ACL & Sports Injuries',
      'Arthritis (Osteo & Rheumatoid)',
      'Balance & Gait Disorders',
    ],
    types: [
      {
        title: 'Orthopedic Physiotherapy',
        desc: 'Treatment for joint pain, arthritis, fractures, and post-surgical recovery — restoring movement and strength after orthopedic procedures.',
      },
      {
        title: 'Sports Rehabilitation',
        desc: 'Specialized programs for athletes and active individuals focused on injury recovery, performance improvement, and return-to-sport training.',
      },
      {
        title: 'Spine Rehabilitation',
        desc: 'Targeted treatment for back pain, neck pain, disc disorders, and post-spine surgery recovery — core strengthening and posture correction.',
      },
      {
        title: 'Joint Replacement Rehabilitation',
        desc: 'Structured recovery programs after knee, hip, or shoulder replacement — early mobilization, strength training, and functional independence.',
      },
      {
        title: 'Geriatric Rehabilitation',
        desc: 'Specialized care for older adults focused on fall prevention, improved mobility, balance restoration, and enhanced independence.',
      },
    ],
    benefits: [
      'Faster recovery after surgery, fracture, or injury',
      'Reduction in chronic pain without relying on medication',
      'Improved strength, flexibility, balance, and coordination',
      'Better stability — reducing the risk of falls and future injuries',
      'Improved quality of life — patients regain confidence and independence',
      'Personalized programs for all ages and fitness levels',
    ],
    recovery: [
      'Initial assessment and goal-setting with your physiotherapist',
      'Customized treatment program designed for your specific condition and goals',
      'Regular sessions combining manual therapy, targeted exercise, and functional training',
      'Progress reviews with program adjustments as you improve',
      'Home exercise plan provided to support recovery between sessions',
    ],
    risks: [
      'Temporary soreness after treatment sessions (normal and expected)',
      'Delayed recovery if prescribed exercises are not followed consistently',
      'Overexertion if too much activity is attempted too soon — progress should be gradual',
    ],
    faqs: [
      { q: 'How long will physiotherapy take?', a: 'Duration depends on your condition, severity of injury, and recovery goals. Some patients need a few weeks; others benefit from several months of rehabilitation.' },
      { q: 'Is physiotherapy painful?', a: 'Some exercises may cause temporary discomfort, particularly in the early stages — but physiotherapy should not cause severe pain. Always inform your therapist if pain increases significantly.' },
      { q: 'Do I need physiotherapy after surgery?', a: 'Yes. Physiotherapy is often a critical part of recovery after orthopedic surgery, helping restore strength, mobility, and function effectively.' },
      { q: 'Can physiotherapy prevent surgery?', a: 'In some cases, physiotherapy can help manage symptoms and improve function, potentially reducing or eliminating the need for surgery.' },
      { q: 'Is home physiotherapy effective?', a: 'Yes. Home physiotherapy can be highly effective when performed under professional guidance — particularly for elderly patients and those with mobility restrictions.' },
    ],
  },
]

export function getSpecialty(slug: string): Specialty | undefined {
  return specialties.find(s => s.slug === slug)
}
