import React, { useRef } from "react";
import { useSelector } from "react-redux";
import html2canvas from "html2canvas-pro";
import { Button } from "@heroui/button";
import { LucideDownload } from "lucide-react";

/* ---------------- Utilities ---------------- */

/** Format number as Indian Rupee currency */
const formatCurrency = (amount = 0) => `₹${amount.toFixed(2)}`;

/** Format date to Indian locale string */
const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

/* ---------------- Subcomponents ---------------- */

const InvoiceHeader = ({ sale, organisation }) => (
  <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-default-200">
    <div className="flex-1">
      <h1 className="text-3xl font-bold mb-1">INVOICE</h1>
      {/* <div className="flex"></div> */}
      <div className="space-y-1">
        <p className="text-sm">
          <span className="font-medium">Invoice #:</span>{" "}
          {sale.invoiceNo || sale.orderNo}
        </p>
        <p className="text-sm">
          <span className="font-medium">Date:</span> {formatDate(sale.createdAt)}
        </p>
      </div>
    </div>

    <div className="text-right">
      <h2 className="text-xl font-bold mb-2">
        {organisation?.name}
      </h2>
      {organisation?.details?.address && (
        <p className="text-sm max-w-xs">{organisation.details.address}</p>
      )}
      {organisation?.details?.phone && (
        <p className="text-sm mt-1">{organisation.details.phone}</p>
      )}
      {organisation?.details?.email && (
        <p className="text-sm">{organisation.details.email}</p>
      )}
    </div>
  </div>
);

const AddressCard = ({
  title,
  name,
  companyName,
  phone,
  email,
  street,
  city,
  zipCode,
}) => (
  <div className="p-4 rounded-lg">
    <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide">
      {title}
    </h3>
    <div className="space-y-1">
      {name && <p className="text-sm font-medium">{name}</p>}
      {companyName && <p className="text-sm">{companyName}</p>}
      {phone && <p className="text-sm">{phone}</p>}
      {email && <p className="text-sm">{email}</p>}
      {street && <p className="text-sm">{street}</p>}
      {(city || zipCode) && (
        <p className="text-sm">
          {city} {zipCode}
        </p>
      )}
    </div>
  </div>
);

const InvoiceTable = ({ items = [] }) => (
  <div className="overflow-x-auto mb-6">
    <table className="w-full">
      <thead>
        <tr className="bg-primary text-white">
          <th className="text-left py-3 px-4 text-sm font-semibold">#</th>
          <th className="text-left py-3 px-4 text-sm font-semibold">
            Description
          </th>
          <th className="text-right py-3 px-4 text-sm font-semibold">Qty</th>
          <th className="text-right py-3 px-4 text-sm font-semibold">Price</th>
          <th className="text-right py-3 px-4 text-sm font-semibold">Total</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, idx) => (
          <tr
            key={idx}
            className="border-b border-gray-200 hover:bg-gray-100 transition-colors"
          >
            <td className="py-4 px-4 text-sm">{idx + 1}</td>
            <td className="py-4 px-4 text-sm font-medium">
              {item.stockId?.productName || "N/A"}
            </td>
            <td className="py-4 px-4 text-sm text-right">{item.quantity}</td>
            <td className="py-4 px-4 text-sm text-right">
              {formatCurrency(item.price)}
            </td>
            <td className="py-4 px-4 text-sm font-medium text-right">
              {formatCurrency(item.total)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const InvoiceSummary = ({ subTotal, tax, discount, grandTotal }) => (
  <div className="flex justify-end mb-8">
    <div className="w-80 p-6 rounded-lg">
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span className="font-medium">{formatCurrency(subTotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Tax</span>
          <span className="font-medium">{formatCurrency(tax)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-sm">
            <span>Discount</span>
            <span className="font-medium text-green-600">
              -{formatCurrency(discount)}
            </span>
          </div>
        )}
        <div className="border-t-2 border-default-300 pt-3 mt-3">
          <div className="flex justify-between">
            <span className="text-base font-bold">Grand Total</span>
            <span className="text-xl font-bold">
              {formatCurrency(grandTotal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const InvoiceFooter = ({ paymentStatus, notes }) => {
  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || "";
    if (statusLower === "paid") return "bg-green-100 text-green-800";
    if (statusLower === "pending") return "bg-yellow-100 text-yellow-800";
    if (statusLower === "overdue") return "bg-red-100 text-red-800";
    return "bg-default-100 text-default-800";
  };

  return (
    <div className="pt-6 border-t border-default-200">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-sm font-medium">Payment Status:</span>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
            paymentStatus
          )}`}
        >
          {paymentStatus || "N/A"}
        </span>
      </div>
      {notes && (
        <div className="p-4 rounded-lg border-l-4 border-blue-400">
          <p className="text-sm font-medium mb-1">Notes:</p>
          <p className="text-sm">{notes}</p>
        </div>
      )}
    </div>
  );
};

/* ---------------- Main Component ---------------- */

export const InvoiceFormatter = ({ sale }) => {
  const organisation = useSelector(
    (state) => state.organisation.organisation?.organisation
  );

  const invoiceRef = useRef();

  /** Download invoice as PNG */
  const downloadInvoiceImage = async () => {
    if (!invoiceRef.current) return;
    const canvas = await html2canvas(invoiceRef.current, {
        scale: 5,
        scrollX: 400,
        backgroundColor: "#fff",
        useCORS: true,
    });
    const link = document.createElement("a");
    link.download = `invoice-${sale.invoiceNo || "export"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  if (!sale) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p className="text-center">No invoice data available</p>
      </div>
    );
  }

    return (
        <div className="max-w-4xl text-black bg-white mx-auto border border-default-200 rounded-lg">
            <div ref={invoiceRef} className="p-4">
                {organisation?.details?.logoUrl && (
                    <img src={organisation.details.logoUrl} alt={`${organisation.name} Logo`} className="h-16 mb-3 object-contain" />
                )}
                <InvoiceHeader sale={sale} organisation={organisation} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <AddressCard
                        title="Bill To"
                        name={sale.customerId?.name}
                        companyName={sale.customerId?.companyName}
                        phone={sale.customerId?.phone}
                        email={sale.customerId?.email}
                        street={sale.customerId?.address?.street}
                        city={sale.customerId?.address?.city}
                        zipCode={sale.customerId?.address?.zipCode}
                    />

                    <AddressCard
                        title="Ship To"
                        name={sale.shippingAddress?.name || sale.customerId?.name}
                        street={
                        sale.shippingAddress?.addressLine ||
                        sale.customerId?.address?.street
                        }
                        city={sale.shippingAddress?.city || sale.customerId?.address?.city}
                        zipCode={
                        sale.shippingAddress?.zipCode || sale.customerId?.address?.zipCode
                        }
                    />
                </div>

                <InvoiceTable items={sale.items || []} />
                <InvoiceSummary
                subTotal={sale.subTotal || 0}
                tax={sale.tax || 0}
                discount={sale.discount || 0}
                grandTotal={sale.grandTotal || 0}
                />
                <InvoiceFooter paymentStatus={sale.paymentStatus} notes={sale.notes} />
            </div>

            {/* Download button */}
            <div className="flex justify-end p-2">
                <Button size="sm" color="primary" onPress={downloadInvoiceImage} startContent={<LucideDownload size={18} />}>Download</Button>
            </div>
        </div>
    );
};
