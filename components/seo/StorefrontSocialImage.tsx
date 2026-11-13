import { BRAND_MARK_DATA_URI } from "@/lib/brandMarkData";
import { SITE_NAME } from "@/lib/seo";

export function StorefrontSocialImage() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 54,
        color: "#251a14",
        background: "linear-gradient(125deg, #fffaf4 0%, #f8efe4 58%, #f0dfcc 100%)",
        fontFamily: "Georgia, serif",
      }}
    >
      <div
        style={{
          width: 620,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingRight: 36,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 42 }}>
          {/* ImageResponse requires native img elements for embedded brand artwork. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={BRAND_MARK_DATA_URI} width={62} height={62} alt="" />
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: -1 }}>{SITE_NAME}</div>
            <div
              style={{
                color: "#8c5b35",
                fontFamily: "Arial, sans-serif",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: 2.2,
              }}
            >
              ARTISAN FASHION &amp; HOME
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 58, fontWeight: 700, lineHeight: 1.08, letterSpacing: -2.5 }}>
          <span>Your cloth,</span>
          <span>your choice.</span>
        </div>
        <div
          style={{
            marginTop: 22,
            maxWidth: 510,
            color: "#65584d",
            fontFamily: "Arial, sans-serif",
            fontSize: 21,
            lineHeight: 1.5,
          }}
        >
          Hand-finished fashion and artisan home pieces, thoughtfully curated for you.
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginTop: 34,
            color: "#a74d21",
            fontFamily: "Arial, sans-serif",
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: 1.8,
          }}
        >
          <div style={{ width: 32, height: 2, background: "#e67632" }} />
          DISCOVER BUNORAA
        </div>
      </div>

      <div
        style={{
          position: "relative",
          width: 420,
          height: 510,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          borderRadius: 34,
          background: "linear-gradient(155deg, #3b2419 0%, #21150f 72%)",
          boxShadow: "0 24px 60px rgba(59, 36, 25, 0.2)",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 360,
            height: 360,
            top: 38,
            right: -90,
            borderRadius: 180,
            background: "linear-gradient(140deg, #f59c56 0%, #e67632 75%)",
            opacity: 0.2,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 300,
            height: 300,
            bottom: -145,
            left: -95,
            borderRadius: 150,
            border: "1px solid rgba(255, 231, 208, 0.24)",
          }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={BRAND_MARK_DATA_URI}
          width={270}
          height={270}
          alt=""
          style={{ position: "absolute", top: 93, left: 75 }}
        />
        <div
          style={{
            position: "absolute",
            left: 30,
            right: 30,
            bottom: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 18,
            borderTop: "1px solid rgba(255, 255, 255, 0.2)",
            color: "#f8e9d8",
            fontFamily: "Arial, sans-serif",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 1.5,
          }}
        >
          <span>MADE WITH CARE</span>
          <span style={{ color: "#f39a58" }}>BANGLADESH</span>
        </div>
      </div>
    </div>
  );
}
