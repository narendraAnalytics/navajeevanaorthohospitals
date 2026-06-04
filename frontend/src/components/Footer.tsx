import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="bfooter">
      <div className="bwrap">
        <div className="foot-grid">
          <div>
            <div className="brand-logo">
              <Image src="/assets/logo.png" alt="logo" width={44} height={44} style={{ borderRadius: '50%' }} />
              <span className="bt">
                <b style={{ fontSize: 16 }}>Navajeevana</b>
                <span>Ortho Hospitals</span>
              </span>
            </div>
            <p className="ab">
              World-class orthopedic care combining advanced technology, expert surgeons and a
              patient-first philosophy — healing mobility, restoring lives across South India.
            </p>
          </div>

          <div>
            <h5>Care</h5>
            <ul>
              <li><a href="#">Knee Replacement</a></li>
              <li><a href="#">Hip Replacement</a></li>
              <li><a href="#">Spine Surgery</a></li>
              <li><a href="#">Sports Medicine</a></li>
              <li><a href="#">Physiotherapy</a></li>
            </ul>
          </div>

          <div>
            <h5>Hospital</h5>
            <ul>
              <li><a href="#">About Us</a></li>
              <li><a href="#">Our Doctors</a></li>
              <li><a href="#">Facilities</a></li>
              <li><a href="#">Insurance</a></li>
              <li><a href="#">Careers</a></li>
            </ul>
          </div>

          <div>
            <h5>Contact</h5>
            <ul>
              <li><a href="#">+91 99000 00000</a></li>
              <li><a href="#">care@navajeevana.in</a></li>
              <li><a href="#">Emergency 24/7</a></li>
              <li><a href="#">Book Appointment</a></li>
              <li><a href="/patient">Patient Portal</a></li>
            </ul>
          </div>
        </div>

        <div className="foot-bot">
          <span>© 2026 Navajeevana Ortho Hospitals. All rights reserved.</span>
          <span>Privacy · Terms · Accessibility</span>
        </div>
      </div>
    </footer>
  )
}
