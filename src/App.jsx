import { useRef, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function App() {
  const pdfRef = useRef(null);

  const [motorData, setMotorData] = useState({
    f: 50,
    p: 4,
    Vline: 400,
    Vdc: 24,
    Idc: 6,
    Vo: 400,
    Io: 5,
    Po: 600,
    Vbr: 100,
    Ibr: 10,
    Pbr: 900,
    ftest: 25,
  });

  const [manualParams, setManualParams] = useState({
    R1: "",
    R2: "",
    X1: "",
    X2: "",
    Rc: "",
    Xm: "",
  });

  const [results, setResults] = useState({
    R1: 0,
    R2: 0,
    X1: 0,
    X2: 0,
    Rc: 0,
    Xm: 0,
    Tmax: 0,
    Smax: 0,
    Ns: 0,
    startingTorque: 0,
    maxPowerOutput: 0,
    speedAtMaxPower: 0,
    speedAtMaxTorque: 0,
  });

  const [torqueSpeedData, setTorqueSpeedData] =
    useState([]);

  const inputStyle = {
  width: "100%",
  padding: "14px",
  borderRadius: "14px",
  border: "1px solid #cfcfcf",
  fontSize: "16px",
  outline: "none",
  background: "#ffffff",
  boxSizing: "border-box",
  color: "#000000",
  fontWeight: "500",
};

  const cardStyle = {
    background: "#ffffff",
    border: "1px solid #d4d4d4",
    borderRadius: "24px",
    padding: "24px",
    boxShadow:
      "0 8px 24px rgba(0,0,0,0.08)",
  };

  const buttonStyle = {
  background: "#ffffff",
  border: "1px solid #404040",
  borderRadius: "16px",
  padding: "14px 24px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "16px",
  color: "#000000",
  transition: "all 0.3s ease",
  transform: "scale(1)",
  boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
};

  const handleChange = (key, value) => {
    setMotorData({
      ...motorData,
      [key]: Number(value),
    });
  };

  const handleParameterChange = (
    key,
    value
  ) => {
    setManualParams({
      ...manualParams,
      [key]: value,
    });
  };

  const runAnalysis = (
    useManual = false
  ) => {
    const {
      f,
      p,
      Vline,
      Vdc,
      Idc,
      Vo,
      Io,
      Po,
      Vbr,
      Ibr,
      Pbr,
      ftest,
    } = motorData;

    const Vph = Vline / Math.sqrt(3);

    const Ns = (120 * f) / p;

    const Ws = (2 * Math.PI * Ns) / 60;

    const autoR1 = Vdc / (2 * Idc);

    const pf =
      Po / (Math.sqrt(3) * Vo * Io);

    const Iw = Io * pf;

    const Im =
      Io * Math.sin(Math.acos(pf));

    const Voph = Vo / Math.sqrt(3);

    const autoRc = Voph / Iw;

    const autoXm = Voph / Im;

    const Vbrph = Vbr / Math.sqrt(3);

    const Zbr = Vbrph / Ibr;

    const Req =
      Pbr / (3 * Ibr * Ibr);

    const Xeq1 = Math.sqrt(
      Math.max(Zbr * Zbr - Req * Req, 0)
    );

    const Xeq = (Xeq1 * f) / ftest;

    const autoR2 = Req - autoR1;

    const autoX1 = Xeq / 2;

    const autoX2 = Xeq / 2;

    if (!useManual) {
      setManualParams({
        R1: autoR1.toFixed(3),
        R2: autoR2.toFixed(3),
        X1: autoX1.toFixed(3),
        X2: autoX2.toFixed(3),
        Rc: autoRc.toFixed(3),
        Xm: autoXm.toFixed(3),
      });
    }

    const R1 =
      useManual && manualParams.R1
        ? Number(manualParams.R1)
        : autoR1;

    const R2 =
      useManual && manualParams.R2
        ? Number(manualParams.R2)
        : autoR2;

    const X1 =
      useManual && manualParams.X1
        ? Number(manualParams.X1)
        : autoX1;

    const X2 =
      useManual && manualParams.X2
        ? Number(manualParams.X2)
        : autoX2;

    const Rc =
      useManual && manualParams.Rc
        ? Number(manualParams.Rc)
        : autoRc;

    const Xm =
      useManual && manualParams.Xm
        ? Number(manualParams.Xm)
        : autoXm;

    const Smax =
      R2 /
      Math.sqrt(
        R1 * R1 + (X1 + X2) ** 2
      );

    const Tmax =
      (3 * Vph * Vph) /
      (2 *
        Ws *
        (R1 +
          Math.sqrt(
            R1 * R1 +
              (X1 + X2) ** 2
          )));

    const startingTorque =
      (3 * Vph * Vph * R2) /
      (Ws *
        ((R1 + R2) ** 2 +
          (X1 + X2) ** 2));

    const SmaxPower =
      R2 /
      (R2 +
        Math.sqrt(
          (R1 + R2) ** 2 +
            (X1 + X2) ** 2
        ));

    const maxPowerOutput =
      (3 * Vph * Vph * R2) /
      ((R1 + R2) ** 2 +
        (X1 + X2) ** 2);

    const speedAtMaxPower =
      Ns * (1 - SmaxPower);

    const speedAtMaxTorque =
      Ns * (1 - Smax);

    const graphData = [];

    for (let k = 1; k <= 100; k++) {
      const slip = k / 100;

      const speed = Ns * (1 - slip);

      const torque =
        (3 *
          Vph *
          Vph *
          (R2 / slip)) /
        (Ws *
          ((R1 + R2 / slip) ** 2 +
            (X1 + X2) ** 2));

      graphData.push({
        speed,
        torque,
      });
    }

    setTorqueSpeedData(graphData);

    setResults({
      R1,
      R2,
      X1,
      X2,
      Rc,
      Xm,
      Tmax,
      Smax,
      Ns,
      startingTorque,
      maxPowerOutput,
      speedAtMaxPower,
      speedAtMaxTorque,
    });
  };

  const maxTorque =
    torqueSpeedData.length > 0
      ? Math.max(
          ...torqueSpeedData.map(
            (p) => p.torque
          )
        )
      : 1;

  const maxSpeed =
    torqueSpeedData.length > 0
      ? Math.max(
          ...torqueSpeedData.map(
            (p) => p.speed
          )
        )
      : 1;

  const TmaxPoint =
    torqueSpeedData.find(
      (p) => p.torque === maxTorque
    );

  const downloadPDF = async () => {
    const input = pdfRef.current;

    const canvas = await html2canvas(
      input,
      {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      }
    );

    const imgData =
      canvas.toDataURL("image/png");

    const pdf = new jsPDF(
      "p",
      "mm",
      "a4"
    );

    const pdfWidth = 200;

    const pdfHeight = 297;

    const imgWidth = pdfWidth;

    const imgHeight =
      (canvas.height * imgWidth) /
      canvas.width;

    let heightLeft = imgHeight;

    let position = 0;

    pdf.addImage(
      imgData,
      "PNG",
      0,
      position,
      imgWidth,
      imgHeight
    );

    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position =
        heightLeft - imgHeight;

      pdf.addPage();

      pdf.addImage(
        imgData,
        "PNG",
        0,
        position,
        imgWidth,
        imgHeight
      );

      heightLeft -= pdfHeight;
    }

    pdf.save(
      "Induction_Motor_Analysis.pdf"
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        padding: "20px",
        fontFamily: "Arial",
      }}
    >
      <div
        ref={pdfRef}
        style={{
          maxWidth: "1800px",
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            fontSize: "46px",
            fontWeight: "bold",
            textAlign: "center",
            color: "#000000",
          }}
        >
          Induction Motor Analysis
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "#404040",
            marginBottom: "30px",
            fontSize: "18px",
          }}
        >
          From No-Load & Blocked Rotor
          Tests
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(320px,1fr))",
            gap: "24px",
            alignItems: "start",
          }}
        >
          {[
            {
              title: "Motor Data",
              fields: [
                [
                  "Frequency (Hz)",
                  "f",
                ],
                [
                  "Number of Poles",
                  "p",
                ],
                [
                  "Line Voltage (V)",
                  "Vline",
                ],
              ],
            },
            {
              title: "DC Test",
              fields: [
                [
                  "DC Voltage (V)",
                  "Vdc",
                ],
                [
                  "DC Current (A)",
                  "Idc",
                ],
              ],
            },
            {
              title: "No Load Test",
              fields: [
                [
                  "No-Load Voltage (V)",
                  "Vo",
                ],
                [
                  "No-Load Current (A)",
                  "Io",
                ],
                [
                  "No-Load Power (W)",
                  "Po",
                ],
              ],
            },
            {
              title:
                "Blocked Rotor Test",
              fields: [
                [
                  "Blocked Rotor Voltage (V)",
                  "Vbr",
                ],
                [
                  "Blocked Rotor Current (A)",
                  "Ibr",
                ],
                [
                  "Blocked Rotor Power (W)",
                  "Pbr",
                ],
                [
                  "Blocked Rotor Test Frequency (Hz)",
                  "ftest",
                ],
              ],
            },
          ].map((section) => (
            <div
              key={section.title}
              style={cardStyle}
            >
              <h2
                style={{
                fontSize: "34px",
                fontWeight: "bold",
                color: "#000000",
                }}
              >
                {section.title}
              </h2>

              {section.fields.map(
                ([label, key]) => (
                  <div
                    key={key}
                    style={{
                      marginBottom: "18px",
                    }}
                  >
                    <label
  style={{
    display: "block",
    marginBottom: "8px",
    fontSize: "16px",
    color: "#000000",
    fontWeight: "500",
  }}
>
                      {label}
                    </label>

                    <input
                      style={
                        inputStyle
                      }
                      value={
                        motorData[key]
                      }
                      onChange={(e) =>
                        handleChange(
                          key,
                          e.target
                            .value
                        )
                      }
                    />
                  </div>
                )
              )}
            </div>
          ))}
        </div>

        <div
          style={{
            ...cardStyle,
            marginTop: "28px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection:
                "column",
              alignItems: "center",
              gap: "18px",
              marginBottom: "24px",
            }}
          >
            <h2
  style={{
    fontSize: "34px",
    fontWeight: "bold",
    color: "#000000",
  }}
>
              Calculated Parameters
            </h2>
            <button
  onClick={() =>
    runAnalysis(false)
  }
  style={buttonStyle}
  onMouseEnter={(e) => {
    e.target.style.transform =
      "scale(1.05)";
    e.target.style.boxShadow =
      "0 8px 20px rgba(0,0,0,0.18)";
  }}
  onMouseLeave={(e) => {
    e.target.style.transform =
      "scale(1)";
    e.target.style.boxShadow =
      "0 4px 10px rgba(0,0,0,0.08)";
  }}
>
  Run Analysis
</button>

     
  
              
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(220px,1fr))",
              gap: "20px",
            }}
          >
            {Object.entries(results)
              .filter(([k]) =>
                [
                  "R1",
                  "R2",
                  "X1",
                  "X2",
                  "Rc",
                  "Xm",
                ].includes(k)
              )
              .map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    background:
                      "#ffffff",
                    border:
                      "1px solid #404040",
                    borderRadius:
                      "18px",
                    padding: "20px",
                    minHeight:
                      "140px",
                    display: "flex",
                    flexDirection:
                      "column",
                    justifyContent:
                      "center",
                    alignItems:
                      "center",
                  }}
                >
                  <p
  style={{
    fontSize:
      "20px",
    marginBottom:
      "12px",
    color:
      "#000000",
    fontWeight:
      "600",
  }}
>
                    {k}
                  </p>

                  <p
  style={{
    fontWeight:
      "bold",
    fontSize:
      "22px",
    color:
      "#000000",
  }}
>
                    {Number(v).toFixed(
                      3
                    )}{" "}
                    Ω
                  </p>
                </div>
              ))}
          </div>
        </div>

        <div
          style={{
            ...cardStyle,
            marginTop: "28px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection:
                "column",
              alignItems: "center",
              gap: "18px",
              marginBottom: "24px",
            }}
          >
            <h2
  style={{
    fontSize: "34px",
    fontWeight: "bold",
    color: "#000000",
  }}
>
              Manual Parameter Override
            </h2>

            <button
  onClick={() =>
    runAnalysis(true)
  }
  style={buttonStyle}
  onMouseEnter={(e) => {
    e.target.style.transform =
      "scale(1.05)";
    e.target.style.boxShadow =
      "0 8px 20px rgba(0,0,0,0.18)";
  }}
  onMouseLeave={(e) => {
    e.target.style.transform =
      "scale(1)";
    e.target.style.boxShadow =
      "0 4px 10px rgba(0,0,0,0.08)";
  }}
>
              Run Modified
              Parameters
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(220px,1fr))",
              gap: "20px",
            }}
          >
            {Object.keys(
              manualParams
            ).map((param) => (
              <div
                key={param}
                style={{
                  background:
                    "#ffffff",
                  border:
                    "1px solid #404040",
                  borderRadius:
                    "18px",
                  padding: "20px",
                  minHeight:
                    "140px",
                }}
              >
                <label
  style={{
    display: "block",
    marginBottom: "8px",
    fontSize: "16px",
    color: "#000000",
    fontWeight: "500",
  }}
>
                  {param}
                </label>

                <input
                  style={inputStyle}
                  value={
                    manualParams[
                      param
                    ]
                  }
                  onChange={(e) =>
                    handleParameterChange(
                      param,
                      e.target
                        .value
                    )
                  }
                />
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            ...cardStyle,
            marginTop: "28px",
          }}
        >
          <h2
  style={{
    fontSize: "34px",
    fontWeight: "bold",
    color: "#000000",
  }}
>
            Performance Parameters
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(220px,1fr))",
              gap: "20px",
            }}
          >
            {[
              {
                label:
                  "Starting Torque",
                value: `${results.startingTorque.toFixed(
                  3
                )} Nm`,
              },
              {
                label:
                  "Maximum Torque",
                value: `${results.Tmax.toFixed(
                  3
                )} Nm`,
              },
              {
                label:
                  "Maximum Power Output",
                value: `${results.maxPowerOutput.toFixed(
                  3
                )} W`,
              },
              {
                label:
                  "Speed at Max Power",
                value: `${results.speedAtMaxPower.toFixed(
                  0
                )} rpm`,
              },
              {
                label:
                  "Speed at Max Torque",
                value: `${results.speedAtMaxTorque.toFixed(
                  0
                )} rpm`,
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  background:
                    "#ffffff",
                  border:
                    "1px solid #404040",
                  borderRadius:
                    "18px",
                  padding: "20px",
                  minHeight:
                    "140px",
                  display: "flex",
                  flexDirection:
                    "column",
                  justifyContent:
                    "center",
                  alignItems:
                    "center",
                  textAlign:
                    "center",
                }}
              >
                <p
  style={{
    marginBottom:
      "12px",
    fontSize:
      "18px",
    color:
      "#000000",
    fontWeight:
      "600",
  }}
>
                  {item.label}
                </p>

                <p
  style={{
    fontWeight:
      "bold",
    fontSize:
      "22px",
    color:
      "#000000",
  }}
>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            ...cardStyle,
            marginTop: "28px",
          }}
        >
          <h2
  style={{
    fontSize: "34px",
    fontWeight: "bold",
    color: "#000000",
  }}
>
            Torque-Speed
            Characteristics
          </h2>

          <div
            style={{
              width: "100%",
              overflowX: "auto",
            }}
          >
            <svg
              viewBox="0 0 900 600"
              style={{
                width: "100%",
                height: "600px",
              }}
            >
              <rect
                width="900"
                height="600"
                fill="#ffffff"
              />

              {[0, 1, 2, 3, 4, 5].map(
                (i) => (
                  <g key={i}>
                    <line
                      x1={
                        80 + i * 148
                      }
                      y1="60"
                      x2={
                        80 + i * 148
                      }
                      y2="500"
                      stroke="#d4d4d4"
                      strokeDasharray="5,5"
                    />

                    <line
                      x1="80"
                      y1={
                        500 - i * 88
                      }
                      x2="820"
                      y2={
                        500 - i * 88
                      }
                      stroke="#d4d4d4"
                      strokeDasharray="5,5"
                    />
                  </g>
                )
              )}

              <line
                x1="80"
                y1="500"
                x2="820"
                y2="500"
                stroke="#000000"
                strokeWidth="2"
              />

              <line
                x1="80"
                y1="500"
                x2="80"
                y2="60"
                stroke="#000000"
                strokeWidth="2"
              />

              {[0, 1, 2, 3, 4, 5].map(
                (i) => (
                  <g key={i}>
                    <text
                      x={
                        70 + i * 148
                      }
                      y="530"
                      fontSize="14"
                    >
                      {Math.round(
                        (maxSpeed /
                          5) *
                          i
                      )}
                    </text>

                    <text
                      x="30"
                      y={
                        505 - i * 88
                      }
                      fontSize="14"
                    >
                      {(
                        (maxTorque /
                          5) *
                        i
                      ).toFixed(0)}
                    </text>
                  </g>
                )
              )}

              <polyline
                fill="none"
                stroke="#000000"
                strokeWidth="4"
                points={torqueSpeedData
                  .map((p) => {
                    const x =
                      80 +
                      (p.speed /
                        maxSpeed) *
                        740;

                    const y =
                      500 -
                      (p.torque /
                        maxTorque) *
                        440;

                    return `${x},${y}`;
                  })
                  .join(" ")}
              />

              {TmaxPoint && (
                <>
                  {(() => {
                    const x =
                      80 +
                      (TmaxPoint.speed /
                        maxSpeed) *
                        740;

                    const y =
                      500 -
                      (TmaxPoint.torque /
                        maxTorque) *
                        440;

                    return (
                      <>
                        <line
                          x1={x}
                          y1="500"
                          x2={x}
                          y2={y}
                          stroke="#000000"
                          strokeDasharray="10,10"
                        />

                        <line
                          x1="80"
                          y1={y}
                          x2="820"
                          y2={y}
                          stroke="#000000"
                          strokeDasharray="10,10"
                        />

                        <circle
                          cx={x}
                          cy={y}
                          r="7"
                          fill="#000000"
                        />

                        <text
                          x={x + 10}
                          y={y - 10}
                          fontSize="16"
                          fontWeight="bold"
                        >
                          Tmax ={" "}
                          {results.Tmax.toFixed(
                            2
                          )}{" "}
                          Nm
                        </text>

                        <text
                          x={x + 10}
                          y="485"
                          fontSize="16"
                          fontWeight="bold"
                        >
                          Speed ={" "}
                          {results.speedAtMaxTorque.toFixed(
                            0
                          )}{" "}
                          rpm
                        </text>
                      </>
                    );
                  })()}
                </>
              )}

              <text
                x="340"
                y="575"
                fontSize="20"
                fontWeight="bold"
              >
                Rotor Speed (rpm)
              </text>

              <text
                x="-320"
                y="24"
                transform="rotate(-90)"
                fontSize="20"
                fontWeight="bold"
              >
                Torque (Nm)
              </text>
            </svg>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent:
              "center",
            marginTop: "30px",
            marginBottom: "30px",
          }}
        >
          <button
  onClick={downloadPDF}
  style={{
    ...buttonStyle,
    padding: "18px 34px",
    fontSize: "18px",
  }}
  onMouseEnter={(e) => {
    e.target.style.transform =
      "scale(1.05)";
    e.target.style.boxShadow =
      "0 8px 20px rgba(0,0,0,0.18)";
  }}
  onMouseLeave={(e) => {
    e.target.style.transform =
      "scale(1)";
    e.target.style.boxShadow =
      "0 4px 10px rgba(0,0,0,0.08)";
  }}
>
            Download PDF Report
          </button>
        </div>
      </div>
    </div>
  );
}