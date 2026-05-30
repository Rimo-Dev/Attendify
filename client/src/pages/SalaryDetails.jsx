import jsPDF from "jspdf";
import "jspdf-autotable";
import { ArrowLeft, Download } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import api from "../services/api";

const SalaryDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [salaryData, setSalaryData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSalaryDetails = async () => {
      try {
        const endpoint = id ? `/salary/predict/${id}` : "/salary/predict";
        const res = await api.get(endpoint);
        setSalaryData(res.data);
      } catch (error) {
        console.error("Failed to fetch salary details", error);
        alert("Failed to load salary details");
      } finally {
        setLoading(false);
      }
    };
    fetchSalaryDetails();
  }, [id]);

  const downloadPDF = () => {
    if (!salaryData) return;
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("Salary Breakdown Report", 14, 22);

    doc.setFontSize(12);
    doc.text(`Employee: ${salaryData.employeeName}`, 14, 32);
    doc.text(`Month: ${salaryData.month}`, 14, 38);
    doc.text(
      `Base Salary: ${salaryData.currency}${salaryData.baseSalary}`,
      14,
      44,
    );

    const headers = [["Type", "Description", "Amount"]];
    const data = salaryData.breakdown.map((item) => [
      item.type,
      item.description,
      `${item.isDeduction ? "-" : ""}${salaryData.currency}${item.amount}`,
    ]);

    doc.autoTable({
      head: headers,
      body: data,
      startY: 50,
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246] },
    });

    const finalY = doc.lastAutoTable.finalY || 50;
    doc.setFontSize(14);
    doc.text(
      `Net Payable: ${salaryData.currency}${salaryData.predictedSalary}`,
      14,
      finalY + 10,
    );

    doc.save(`Payslip_${salaryData.employeeName}_${salaryData.month}.pdf`);
  };

  if (loading) return <div>Loading salary details...</div>;
  if (!salaryData) return <div>No salary data found.</div>;

  return (
    <div className="animate-fade-in">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          className="btn"
          style={{ padding: "8px", background: "rgba(255,255,255,0.1)" }}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: "2rem", marginBottom: "4px" }}>
            Salary Breakdown
          </h1>
          <p style={{ color: "var(--text-muted)" }}>
            Detailed payslip for {salaryData.employeeName} ({salaryData.month})
          </p>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <button
            onClick={downloadPDF}
            className="btn btn-primary"
            style={{ display: "flex", gap: "8px", alignItems: "center" }}
          >
            <Download size={18} /> Download Payslip
          </button>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: "32px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "24px",
            marginBottom: "32px",
            borderBottom: "1px solid var(--glass-border)",
            paddingBottom: "32px",
          }}
        >
          <div>
            <p style={{ color: "var(--text-muted)" }}>Base Salary</p>
            <p style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
              {salaryData.currency}
              {salaryData.baseSalary}
            </p>
          </div>
          <div>
            <p style={{ color: "var(--text-muted)" }}>Daily Rate</p>
            <p style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
              {salaryData.currency}
              {salaryData.dailyRate} / day
            </p>
          </div>
          <div>
            <p style={{ color: "var(--text-muted)" }}>Working Days</p>
            <p style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
              {salaryData.workingDaysInMonth}
            </p>
          </div>
          <div>
            <p style={{ color: "var(--text-muted)" }}>Paid Days</p>
            <p style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
              {salaryData.paidWorkingDays ?? salaryData.workingDaysInMonth}
            </p>
          </div>
          <div>
            <p style={{ color: "var(--text-muted)" }}>Net Payable</p>
            <p
              style={{
                fontSize: "2rem",
                fontWeight: "bold",
                color: "var(--success)",
              }}
            >
              {salaryData.currency}
              {salaryData.predictedSalary}
            </p>
          </div>
        </div>

        <h2 style={{ fontSize: "1.2rem", marginBottom: "16px" }}>
          Breakdown Details
        </h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Description / Reason</th>
                <th style={{ textAlign: "right" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {salaryData.breakdown.map((item, index) => (
                <tr key={index}>
                  <td>
                    <span
                      className={`badge badge-${item.isDeduction ? "Absent" : "Present"}`}
                    >
                      {item.type}
                    </span>
                  </td>
                  <td>{item.description}</td>
                  <td
                    style={{
                      textAlign: "right",
                      color: item.isDeduction
                        ? "var(--danger)"
                        : "var(--success)",
                      fontWeight: "bold",
                    }}
                  >
                    {item.isDeduction ? "-" : "+"} {salaryData.currency}
                    {item.amount}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td
                  colSpan="2"
                  style={{
                    textAlign: "right",
                    fontWeight: "bold",
                    fontSize: "1.2rem",
                  }}
                >
                  Total Final Salary:
                </td>
                <td
                  style={{
                    textAlign: "right",
                    fontWeight: "bold",
                    fontSize: "1.5rem",
                    color: "var(--success)",
                  }}
                >
                  {salaryData.currency}
                  {salaryData.predictedSalary}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalaryDetails;
