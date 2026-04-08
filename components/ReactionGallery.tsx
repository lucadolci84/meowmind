"use client";

export default function ReactionGallery() {
  return (
    <div className="card">
      <div className="sectionLabel">Le tue clip</div>
      <h2 style={{ marginBottom: 10 }}>Archivio clip</h2>
      <p className="small">
        Qui appariranno le clip salvate quando attiveremo il recorder video completo.
      </p>
      <div className="emptyState">
        <div style={{ fontWeight: 800 }}>Ancora nessuna clip</div>
        <div className="small" style={{ marginTop: 8 }}>
          Il prossimo step e collegare il live a registrazione video e card social.
        </div>
      </div>
    </div>
  );
}
