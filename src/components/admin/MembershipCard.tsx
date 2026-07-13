import { forwardRef } from "react";

type Props = {
  fullName: string;
  membershipNumber: string;
  category: string;
  dateJoined: string;
  photoUrl: string | null;
};

export const MembershipCard = forwardRef<HTMLDivElement, Props>(function MembershipCard(
  { fullName, membershipNumber, category, dateJoined, photoUrl },
  ref
) {
  return (
    <div
      ref={ref}
      style={{
        width: 640,
        height: 400,
        background: "linear-gradient(135deg, #14532d 0%, #166534 55%, #eab308 100%)",
        color: "#fff",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: 28,
        borderRadius: 20,
        position: "relative",
        boxShadow: "0 12px 32px rgba(0,0,0,0.25)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 12, letterSpacing: 3, opacity: 0.85, textTransform: "uppercase" }}>
            The Ulu We Want SHG
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>Membership Card</div>
        </div>
        <div
          style={{
            background: "rgba(255,255,255,0.15)",
            padding: "6px 12px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 600,
            textTransform: "capitalize",
          }}
        >
          {category}
        </div>
      </div>

      <div style={{ display: "flex", gap: 24, marginTop: 32, alignItems: "center" }}>
        <div
          style={{
            width: 130,
            height: 160,
            borderRadius: 12,
            overflow: "hidden",
            background: "rgba(255,255,255,0.15)",
            border: "3px solid rgba(255,255,255,0.4)",
            flexShrink: 0,
          }}
        >
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={fullName}
              crossOrigin="anonymous"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>
              {fullName.charAt(0)}
            </div>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, opacity: 0.75, textTransform: "uppercase", letterSpacing: 2 }}>Full Name</div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 4 }}>{fullName}</div>

          <div style={{ marginTop: 20, fontSize: 11, opacity: 0.75, textTransform: "uppercase", letterSpacing: 2 }}>
            Membership ID
          </div>
          <div style={{ fontSize: 20, fontWeight: 600, marginTop: 2, letterSpacing: 1 }}>{membershipNumber}</div>

          <div style={{ marginTop: 16, fontSize: 11, opacity: 0.75, textTransform: "uppercase", letterSpacing: 2 }}>
            Date Joined
          </div>
          <div style={{ fontSize: 14, marginTop: 2 }}>
            {new Date(dateJoined).toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" })}
          </div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 20,
          left: 28,
          right: 28,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 11,
          opacity: 0.8,
        }}
      >
        <span>Empowering Ulu, one member at a time.</span>
        <span>uluwewant.org</span>
      </div>
    </div>
  );
});
