import { describe, expect, it } from "vitest";
import {
  computeRanking,
  computeVariableAnalysis,
  selectTopVariables,
  type VariableRef,
} from "@/lib/analysis";

/**
 * Fixture khusus unit test (tidak pernah masuk aplikasi maupun database).
 */
const variables: VariableRef[] = Array.from({ length: 6 }, (_, index) => ({
  id: `var-${index + 1}`,
  code: `code_${index + 1}`,
  name: `Variabel ${index + 1}`,
  order_index: index + 1,
}));

describe("computeVariableAnalysis", () => {
  it("mengembalikan nol responden ketika belum ada jawaban", () => {
    const stats = computeVariableAnalysis(variables, []);
    expect(stats).toHaveLength(6);
    expect(stats.every((stat) => stat.respondentCount === 0 && stat.total === 0)).toBe(true);
  });

  it("menghitung total dan rata-rata sesuai rumus", () => {
    const stats = computeVariableAnalysis(variables, [
      { variable_id: "var-1", score: 5 },
      { variable_id: "var-1", score: 4 },
      { variable_id: "var-2", score: 3 },
    ]);
    const first = stats.find((stat) => stat.variable_id === "var-1")!;
    expect(first.total).toBe(9);
    expect(first.respondentCount).toBe(2);
    expect(first.average).toBeCloseTo(4.5, 10);
    expect(first.rank).toBe(1);
  });

  it("mengurutkan berdasarkan rata-rata tertinggi", () => {
    const stats = computeVariableAnalysis(variables, [
      { variable_id: "var-1", score: 2 },
      { variable_id: "var-2", score: 5 },
      { variable_id: "var-3", score: 4 },
    ]);
    expect(stats.map((stat) => stat.variable_id).slice(0, 3)).toEqual(["var-2", "var-3", "var-1"]);
  });
});

describe("selectTopVariables", () => {
  it("tidak memilih apa pun ketika belum ada data", () => {
    const stats = computeVariableAnalysis(variables, []);
    expect(selectTopVariables(stats, 5)).toHaveLength(0);
  });

  it("bobot berjumlah tepat 1", () => {
    const rows = variables.flatMap((variable, index) => [
      { variable_id: variable.id, score: ((index + 1) % 5) + 1 },
      { variable_id: variable.id, score: 5 - (index % 4) },
    ]);
    const stats = computeVariableAnalysis(variables, rows);
    const top = selectTopVariables(stats, 5);
    expect(top).toHaveLength(5);
    const sum = top.reduce((acc, item) => acc + item.weight, 0);
    expect(sum).toBeCloseTo(1, 12);
  });

  it("bobot = rata-rata / total rata-rata TOP N", () => {
    const stats = computeVariableAnalysis(variables, [
      { variable_id: "var-1", score: 5 },
      { variable_id: "var-2", score: 4 },
      { variable_id: "var-3", score: 3 },
    ]);
    const top = selectTopVariables(stats, 3);
    expect(top[0].weight).toBeCloseTo(5 / 12, 12);
    expect(top[1].weight).toBeCloseTo(4 / 12, 12);
    expect(top[2].weight).toBeCloseTo(3 / 12, 12);
  });
});

describe("computeRanking", () => {
  const stats = computeVariableAnalysis(variables.slice(0, 3), [
    { variable_id: "var-1", score: 5 },
    { variable_id: "var-2", score: 4 },
    { variable_id: "var-3", score: 3 },
  ]);
  const top = selectTopVariables(stats, 3);

  it("tidak menghasilkan ranking tanpa assessment", () => {
    const result = computeRanking([{ id: "gpu-1", name: "GPU A" }], [], top);
    expect(result.ranked).toHaveLength(0);
    expect(result.incomplete).toHaveLength(1);
    expect(result.incomplete[0].missing).toHaveLength(3);
  });

  it("menghitung Σ(nilai × bobot) dan mengurutkan dari skor tertinggi", () => {
    const result = computeRanking(
      [
        { id: "gpu-1", name: "GPU A" },
        { id: "gpu-2", name: "GPU B" },
      ],
      [
        { gpu_id: "gpu-1", variable_id: "var-1", score: 5 },
        { gpu_id: "gpu-1", variable_id: "var-2", score: 4 },
        { gpu_id: "gpu-1", variable_id: "var-3", score: 3 },
        { gpu_id: "gpu-2", variable_id: "var-1", score: 3 },
        { gpu_id: "gpu-2", variable_id: "var-2", score: 3 },
        { gpu_id: "gpu-2", variable_id: "var-3", score: 3 },
      ],
      top,
    );

    expect(result.ranked).toHaveLength(2);
    expect(result.ranked[0].gpu_id).toBe("gpu-1");
    expect(result.ranked[0].finalScore).toBeCloseTo(
      5 * (5 / 12) + 4 * (4 / 12) + 3 * (3 / 12),
      12,
    );
    expect(result.ranked[1].finalScore).toBeCloseTo(3, 12);
    expect(result.ranked.map((item) => item.rank)).toEqual([1, 2]);
  });

  it("mengabaikan GPU dengan assessment tidak lengkap", () => {
    const result = computeRanking(
      [
        { id: "gpu-1", name: "GPU A" },
        { id: "gpu-2", name: "GPU B" },
      ],
      [
        { gpu_id: "gpu-1", variable_id: "var-1", score: 5 },
        { gpu_id: "gpu-1", variable_id: "var-2", score: 5 },
        { gpu_id: "gpu-1", variable_id: "var-3", score: 5 },
        { gpu_id: "gpu-2", variable_id: "var-1", score: 5 },
      ],
      top,
    );
    expect(result.ranked.map((item) => item.gpu_id)).toEqual(["gpu-1"]);
    expect(result.incomplete.map((item) => item.gpu_id)).toEqual(["gpu-2"]);
  });

  it("skor sama mendapat peringkat sama", () => {
    const result = computeRanking(
      [
        { id: "gpu-1", name: "GPU A" },
        { id: "gpu-2", name: "GPU B" },
      ],
      [
        { gpu_id: "gpu-1", variable_id: "var-1", score: 4 },
        { gpu_id: "gpu-1", variable_id: "var-2", score: 4 },
        { gpu_id: "gpu-1", variable_id: "var-3", score: 4 },
        { gpu_id: "gpu-2", variable_id: "var-1", score: 4 },
        { gpu_id: "gpu-2", variable_id: "var-2", score: 4 },
        { gpu_id: "gpu-2", variable_id: "var-3", score: 4 },
      ],
      top,
    );
    expect(result.ranked.map((item) => item.rank)).toEqual([1, 1]);
  });
});
