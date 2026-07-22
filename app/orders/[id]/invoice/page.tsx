import dynamic from "next/dynamic";

const OrderInvoicePageContent = dynamic(
  () => import("@/components/orders/OrderInvoicePageContent").then((mod) => mod.OrderInvoicePageContent),
  { loading: () => <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div> }
);

export default function OrderInvoicePage() {
  return <OrderInvoicePageContent />;
}
