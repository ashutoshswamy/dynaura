// <boarding>
export const Boarding = () => (
  <div className="fc">
    <div className="fc-top">
      <span className="fc-brand">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
        </svg>
        SKYWAY
      </span>
      <span className="fc-mute">SW 218, Delhi to Mumbai</span>
    </div>

    <div className="fc-grid">
      <div><span className="fc-label">Gate</span><span className="fc-val">24</span></div>
      <div><span className="fc-label">Seat</span><span className="fc-val">14A</span></div>
      <div><span className="fc-label">Group</span><span className="fc-val">2</span></div>
      <div><span className="fc-label">Boards</span><span className="fc-val">07:45</span></div>
    </div>

    <div className="fc-tear" />
    <div className="fc-barcode" aria-hidden="true" />
  </div>
);
// </boarding>

// <ride>
export const Ride = () => (
  <div className="fc">
    <div className="fc-row">
      <span className="fc-av">AK</span>
      <div>
        <b>Arjun K.</b> <span className="fc-mute">4.9 rating</span>
        <div className="fc-mute">White Swift, DL 3C 4821</div>
      </div>
    </div>
    <div>
      <div className="fc-steps"><i className="on" /><i className="on" /><i /></div>
      <div className="fc-line" style={{ marginTop: 10 }}>
        <span className="fc-mute">Picked up</span><span className="fc-mute">On the way</span><span className="fc-mute">Arrived</span>
      </div>
    </div>
  </div>
);
// </ride>

// <food>
export const Food = () => (
  <div className="fc">
    <div className="fc-row">
      <div><b>Tandoori Tales</b><div className="fc-mute">2 Butter chicken, 4 Naan</div></div>
      <span className="fc-eta">12 min</span>
    </div>
    <div>
      <div className="fc-steps"><i className="on" /><i className="on" /><i className="on" /><i /></div>
      <div className="fc-line" style={{ marginTop: 10 }}>
        <span className="fc-mute">Preparing</span><span className="fc-mute">Picked up</span><span className="fc-mute">Nearby</span><span className="fc-mute">Door</span>
      </div>
    </div>
  </div>
);
// </food>

// <pay>
export const Pay = () => (
  <div className="fc">
    <div>
      <div className="fc-big">$128.00</div>
      <div className="fc-mute">To Maya Chen, dinner split</div>
    </div>
    <div style={{ display: "grid", gap: 10 }}>
      <div className="fc-line"><span className="fc-mute">Fee</span><b>$0.00</b></div>
      <div className="fc-line"><span className="fc-mute">Balance</span><b>$2,431.20</b></div>
    </div>
  </div>
);
// </pay>
