import { describe, expect, it } from "vitest";
import { buildCsvTemplate, guessMapping, parseLikertValue, validateCsvRow } from "@/lib/csv";
import type { Variable } from "@/lib/types";

const variables: Variable[] = [
  {
    id: "v1",
    code: "performa_gaming",
    name: "Performa Gaming",
    description: null,
    order_index: 1,
    created_at: "",
    updated_at: "",
  },
  {
    id: "v2",
    code: "harga_gpu",
    name: "Harga GPU",
    description: null,
    order_index: 2,
    created_at: "",
    updated_at: "",
  },
];

describe("parseLikertValue", () => {
  it("menerima angka 1-5", () => {
    expect(parseLikertValue("4").value).toBe(4);
    expect(parseLikertValue(2).value).toBe(2);
  });

  it("menerima format '5 - Sangat Penting'", () => {
    expect(parseLikertValue("5 - Sangat Penting").value).toBe(5);
  });

  it("menerima label teks", () => {
    expect(parseLikertValue("Sangat Penting").value).toBe(5);
    expect(parseLikertValue("cukup penting").value).toBe(3);
  });

  it("menolak nilai di luar rentang dan nilai kosong", () => {
    expect(parseLikertValue("6").value).toBeNull();
    expect(parseLikertValue("0").value).toBeNull();
    expect(parseLikertValue("").value).toBeNull();
    expect(parseLikertValue(null).value).toBeNull();
    expect(parseLikertValue("abc").value).toBeNull();
  });
});

describe("guessMapping", () => {
  it("mencocokkan header dengan nama variabel", () => {
    const mapping = guessMapping(
      ["Nama Responden", "Usia", "Performa Gaming", "Harga GPU"],
      variables,
    );
    expect(mapping.name).toBe("Nama Responden");
    expect(mapping.age).toBe("Usia");
    expect(mapping.variables.v1).toBe("Performa Gaming");
    expect(mapping.variables.v2).toBe("Harga GPU");
  });

  it("mengembalikan string kosong jika kolom tidak ditemukan", () => {
    const mapping = guessMapping(["Kolom A", "Kolom B"], variables);
    expect(mapping.variables.v1).toBe("");
  });
});

describe("validateCsvRow", () => {
  const mapping = guessMapping(["Nama", "Usia", "Performa Gaming", "Harga GPU"], variables);

  it("baris valid tidak memiliki error", () => {
    const row = validateCsvRow(
      { Nama: "R-001", Usia: "21", "Performa Gaming": "5", "Harga GPU": "4" },
      2,
      mapping,
      variables,
    );
    expect(row.errors).toHaveLength(0);
    expect(row.scores).toEqual({ v1: 5, v2: 4 });
    expect(row.age).toBe(21);
  });

  it("melaporkan nilai Likert tidak valid", () => {
    const row = validateCsvRow(
      { Nama: "R-002", "Performa Gaming": "9", "Harga GPU": "" },
      3,
      mapping,
      variables,
    );
    expect(row.errors.length).toBe(2);
  });

  it("melaporkan usia tidak valid", () => {
    const row = validateCsvRow(
      { Nama: "R-003", Usia: "abc", "Performa Gaming": "3", "Harga GPU": "3" },
      4,
      mapping,
      variables,
    );
    expect(row.errors.some((error) => error.includes("Usia"))).toBe(true);
  });
});

describe("buildCsvTemplate", () => {
  it("hanya berisi satu baris header tanpa data contoh", () => {
    const template = buildCsvTemplate(variables);
    const lines = template.trim().split("\n");
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain("Performa Gaming");
    expect(lines[0]).toContain("Nama atau ID Responden");
  });
});
