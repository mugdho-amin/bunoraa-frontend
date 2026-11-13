import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ProductVariant } from "@/lib/types";
import { VariantSelector } from "@/components/products/VariantSelector";

const variants: ProductVariant[] = [
  {
    id: "small-red",
    is_default: true,
    stock_quantity: 2,
    option_values: [
      { id: "s", option: { id: "size", name: "Size", slug: "size" }, value: "S" },
      { id: "red", option: { id: "color", name: "Color", slug: "color" }, value: "Red" },
    ],
  },
  {
    id: "small-blue",
    stock_quantity: 0,
    option_values: [
      { id: "s", option: { id: "size", name: "Size", slug: "size" }, value: "S" },
      { id: "blue", option: { id: "color", name: "Color", slug: "color" }, value: "Blue" },
    ],
  },
  {
    id: "large-red",
    stock_quantity: 0,
    option_values: [
      { id: "l", option: { id: "size", name: "Size", slug: "size" }, value: "L" },
      { id: "red", option: { id: "color", name: "Color", slug: "color" }, value: "Red" },
    ],
  },
  {
    id: "large-blue",
    stock_quantity: 4,
    option_values: [
      { id: "l", option: { id: "size", name: "Size", slug: "size" }, value: "L" },
      { id: "blue", option: { id: "color", name: "Color", slug: "color" }, value: "Blue" },
    ],
  },
  {
    id: "xl-green",
    stock_quantity: 0,
    option_values: [
      { id: "xl", option: { id: "size", name: "Size", slug: "size" }, value: "XL" },
      { id: "green", option: { id: "color", name: "Color", slug: "color" }, value: "Green" },
    ],
  },
];

describe("VariantSelector", () => {
  it("selects an in-stock default and resolves only complete available combinations", () => {
    const onChange = vi.fn();
    render(<VariantSelector variants={variants} selectedVariantId={null} onChange={onChange} />);

    expect(onChange).toHaveBeenLastCalledWith("small-red");

    fireEvent.click(screen.getByRole("button", { name: "Color: Blue" }));
    expect(onChange).toHaveBeenLastCalledWith(null);

    fireEvent.click(screen.getByRole("button", { name: "Size: L" }));
    expect(onChange).toHaveBeenLastCalledWith("large-blue");
  });

  it("disables option values that have no in-stock variant", () => {
    render(<VariantSelector variants={variants} selectedVariantId={null} onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Color: Green, unavailable with the current options" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Size: XL, unavailable with the current options" })).toBeDisabled();
  });
});
