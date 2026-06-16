/**
 * OptionsAnalyzer — screen for analyzing option premiums over a date range
 * Accepts JSON input with array of objects, calls Massive.com API, and displays results
 */

import React, { useState } from "react";
import {
  Button,
  Input,
  Space,
  Table,
  Alert,
  Spin,
  Card,
  Col,
  Row,
  message,
  Empty,
} from "antd";
import { PlayCircleOutlined, CopyOutlined, CheckOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { fetchOptionPrice } from "../api/backtest";
import type {
  OptionsInput,
  OptionsAnalysisRow,
  StrikePremium,
} from "../types";

interface AnalysisResult {
  rows: OptionsAnalysisRow[];
  inputData: OptionsInput[];
}

const OptionsAnalyzer: React.FC = () => {
  const [jsonInput, setJsonInput] = useState<string>(
    JSON.stringify(
      [
        {
          expiryDate: "2026-06-18",
          date: "2026-05-15",
          strikePrice: 750,
          symbol: "SPY",
        },
      ],
      null,
      2
    )
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [copied, setCopied] = useState(false);

  /**
   * Generate array of dates between two dates (inclusive)
   */
  const generateDateRange = (startDate: string, endDate: string): string[] => {
    const dates: string[] = [];
    let current = dayjs(startDate);
    const end = dayjs(endDate);

    while (current.valueOf() <= end.valueOf()) {
      dates.push(current.format("YYYY-MM-DD"));
      current = current.add(1, "day");
    }

    return dates;
  };

  /**
   * Format date from YYYY-MM-DD to YYMMDD
   */
  const formatExpiryDate = (dateStr: string): string => {
    return dayjs(dateStr).format("YYMMDD");
  };

  /**
   * Format date from YYYY-MM-DD to MM/DD/YY for display
   */
  const formatDisplayDate = (dateStr: string): string => {
    return dayjs(dateStr).format("MM/DD/YY");
  };

  /**
   * Parse JSON input and validate structure
   */
  const parseInput = (): OptionsInput[] => {
    try {
      const parsed = JSON.parse(jsonInput);

      if (!Array.isArray(parsed)) {
        throw new Error("Input must be an array of objects");
      }

      if (parsed.length === 0) {
        throw new Error("Input array cannot be empty");
      }

      // Validate each object
      parsed.forEach((obj, idx) => {
        if (!obj.expiryDate || !obj.date || typeof obj.strikePrice !== "number" || !obj.symbol) {
          throw new Error(
            `Invalid object at index ${idx}: must have expiryDate, date, strikePrice, and symbol`
          );
        }
        // Validate dates are valid ISO format
        if (!dayjs(obj.expiryDate).isValid() || !dayjs(obj.date).isValid()) {
          throw new Error(
            `Invalid date format at index ${idx}: dates must be in YYYY-MM-DD format`
          );
        }
      });

      return parsed;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to parse JSON";
      throw new Error(msg);
    }
  };

  /**
   * Main analysis function
   */
  const handleAnalyze = async () => {
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const inputData = parseInput();

      // Get the date range from first to last object
      const startDate = inputData[0].date;
      const endDate = inputData[inputData.length - 1].date;
      const dateRange = generateDateRange(startDate, endDate);

      // Use the first object's data (symbol, strike price, expiry)
      const firstInput = inputData[0];
      const strikePrice = firstInput.strikePrice;
      const symbol = firstInput.symbol.toUpperCase();
      const expiryDate = formatExpiryDate(firstInput.expiryDate);

      const rows: OptionsAnalysisRow[] = [];

      // For each date in range, fetch CE and PE premiums
      for (const date of dateRange) {
        const ceStrike = strikePrice + 5;
        const peStrike = strikePrice - 5;

        // Fetch prices in parallel
        const [cePrice, pePrice] = await Promise.all([
          fetchOptionPrice(symbol, expiryDate, ceStrike, "C", date),
          fetchOptionPrice(symbol, expiryDate, peStrike, "P", date),
        ]);

        const row: OptionsAnalysisRow = {
          date: formatDisplayDate(date),
          closingPrice: strikePrice,
          ceStrike,
          peStrike,
          cePremiumData: cePrice
            ? {
                expiryDate: formatDisplayDate(firstInput.expiryDate),
                strike: ceStrike,
                closePrice: cePrice,
              }
            : null,
          pePremiumData: pePrice
            ? {
                expiryDate: formatDisplayDate(firstInput.expiryDate),
                strike: peStrike,
                closePrice: pePrice,
              }
            : null,
        };

        rows.push(row);
      }

      setResult({ rows, inputData });
      message.success(`Analysis completed for ${rows.length} dates`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Copy results to clipboard as JSON
   */
  const copyToClipboard = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(result.rows, null, 2));
      setCopied(true);
      message.success("Results copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      message.error("Failed to copy");
    }
  };

  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: 100,
    },
    {
      title: "Closing/Stock Price",
      dataIndex: "closingPrice",
      key: "closingPrice",
      width: 150,
      render: (value: number) => value.toFixed(2),
    },
    {
      title: "CE Strike",
      dataIndex: "ceStrike",
      key: "ceStrike",
      width: 120,
      render: (value: number) => value.toFixed(0),
    },
    {
      title: "PE Strike",
      dataIndex: "peStrike",
      key: "peStrike",
      width: 120,
      render: (value: number) => value.toFixed(0),
    },
    {
      title: "CE Call Premium",
      dataIndex: "cePremiumData",
      key: "cePremium",
      width: 200,
      render: (value: StrikePremium | null) => {
        if (!value) return "—";
        return `${value.expiryDate}-${value.strike}-${value.closePrice.toFixed(2)}`;
      },
    },
    {
      title: "PE Call Premium",
      dataIndex: "pePremiumData",
      key: "pePremium",
      width: 200,
      render: (value: StrikePremium | null) => {
        if (!value) return "—";
        return `${value.expiryDate}-${value.strike}-${value.closePrice.toFixed(2)}`;
      },
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <Card title="Options Chain Analyzer" style={{ marginBottom: "24px" }}>
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
              Input JSON (Array of Options):
            </label>
            <Input.TextArea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              rows={10}
              placeholder='[{"expiryDate": "2026-06-18", "date": "2026-05-15", "strikePrice": 750, "symbol": "SPY"}]'
              style={{ fontFamily: "monospace" }}
            />
            <p style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
              Format: Array of objects with expiryDate, date, strikePrice, and symbol.
              Dates should be in YYYY-MM-DD format.
            </p>
          </div>

          <Space>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={handleAnalyze}
              loading={loading}
              size="large"
            >
              Analyze
            </Button>
          </Space>

          {error && <Alert message="Error" description={error} type="error" showIcon />}
        </Space>
      </Card>

      {loading && (
        <Card style={{ textAlign: "center" }}>
          <Spin size="large" tip="Fetching option prices..." />
        </Card>
      )}

      {result && (
        <Card title="Analysis Results" style={{ marginBottom: "24px" }}>
          <Space style={{ marginBottom: "16px" }}>
            <Button
              icon={copied ? <CheckOutlined /> : <CopyOutlined />}
              onClick={copyToClipboard}
            >
              {copied ? "Copied!" : "Copy Results"}
            </Button>
          </Space>

          {result.rows.length === 0 ? (
            <Empty description="No data to display" />
          ) : (
            <Table
              columns={columns}
              dataSource={result.rows.map((row, idx) => ({
                ...row,
                key: idx,
              }))}
              pagination={{ pageSize: 50 }}
              scroll={{ x: 1200 }}
              size="small"
            />
          )}

          <div style={{ marginTop: "24px" }}>
            <p style={{ fontWeight: "500", marginBottom: "8px" }}>Input Data:</p>
            <pre
              style={{
                backgroundColor: "#f5f5f5",
                padding: "12px",
                borderRadius: "4px",
                overflow: "auto",
              }}
            >
              {JSON.stringify(result.inputData, null, 2)}
            </pre>
          </div>
        </Card>
      )}
    </div>
  );
};

export default OptionsAnalyzer;
