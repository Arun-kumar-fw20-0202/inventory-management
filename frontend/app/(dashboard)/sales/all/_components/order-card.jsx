import React from 'react';
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { User } from "@heroui/user";
import { Divider } from "@heroui/divider";
import { FixedOrPercentage } from '@/libs/utils';
import ConfirmActionModal from './ConfirmActionModal'
import { Button } from '@heroui/button'
import { Select, SelectItem } from '@heroui/select';

export const OrderCard = ({ order, actions = {} }) => {
  const { SubmitSale, submetting, ApproveSale, approving, approved, RejectSale, rejecting, rejected, CompleteSale, completing, completed, MarkOrderAsPaid, markingAsPaid, markedAsPaid } = actions
  const [rejectOpen, setRejectOpen] = React.useState(false)
  const getStatusColor = (status) => {
    const colors = {
      submitted: 'warning',
      processing: 'primary',
      completed: 'success',
      cancelled: 'danger'
    };
    return colors[status] || 'default';
  };

  const getPaymentStatusColor = (status) => (status === 'paid' ? 'success' : status == 'partial' ? 'warning' : 'danger');

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const HandleUpdatePayment = async (status, id) => {
    if (markingAsPaid) return;
    await MarkOrderAsPaid({ id, status })
  }

  return (
    <Card className=" w-full shadow-none duration-300 border border-default">
      {/* Header Section */}
      <CardHeader className="flex justify-between items-start pb-0 pt-4 px-6">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-400">{order?.orderNo}</h3>
          {/* <p className="text-xs text-gray-500">Org: {order?.orgNo}</p> */}
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <Chip 
            color={getStatusColor(order?.status)} 
            variant="flat"
            size="sm"
            className="capitalize"
          >
            {order?.status}
          </Chip>
          <Chip 
            color={getPaymentStatusColor(order?.paymentStatus)} 
            variant="flat"
            size="sm"
            className="capitalize"
          >
            {order?.paymentStatus}
          </Chip>
        </div>
      </CardHeader>

      <CardBody className="px-6 py-4">
        {/* Customer Info */}
        <div className="mb-4">
          <User
            name={order?.customerId.name}
            description={order?.customerId.email}
            avatarProps={{
              name: order?.customerId.name.charAt(0),
              className: "bg-gradient-to-br from-primary-500 to-secondary-500 text-white"
            }}
          />
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 ml-12">📞 {order?.customerId.phone}</p>
        </div>

        <Divider className="my-3" />

        {/* Items Section */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-400 mb-2">Order Items</h4>
          {order?.items.map((item, idx) => (
            <div key={idx} className="flex justify-between items-start p-3 rounded-lg border border-default">
              <div className="flex-1">
                <p className="font-medium text-gray-800 dark:text-gray-400">{item.stockId.productName}</p>
                <p className="text-xs text-gray-500">SKU: {item.stockId.sku}</p>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">{item.stockId.description}</p>
              </div>
              <div className="text-right ml-4">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-400">₹{item.price}</p>
                <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
              </div>
            </div>
          ))}
        </div>


        <Divider className="my-3" />

        {/* Pricing Details */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-300">Subtotal</span>
            <span className="font-medium">₹{order?.subTotal.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-300">Discount ({FixedOrPercentage(order?.discountType)})</span>
            <span className="font-medium text-green-600">
              -₹{((order?.subTotal * order?.discount) / 100).toFixed(2)}
            </span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-300">Tax  ({FixedOrPercentage(order?.taxType)})</span>
            <span className="font-medium">₹{order?.tax.toFixed(2)}</span>
          </div>
          
          <Divider className="my-2" />
          
          <div className="flex justify-between items-center">
            <span className="text-base font-bold text-gray-800 dark:text-gray-400">Grand Total</span>
            <span className="text-xl font-bold text-blue-600">₹{order?.grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </CardBody>

      <CardFooter className="px-6 py-3 bg-default">
        <div className="flex flex-col md:flex-row justify-between items-center w-full text-xs text-gray-500 dark:text-gray-300">
          <div className="mb-2 md:mb-0">
            <span className="font-medium">Created:</span> {formatDate(order?.createdAt)} · <span className="font-medium">By:</span> {order?.createdBy.name}
          </div>

          <div className="flex items-center gap-2">
            {/* Buttons: submit, approve, reject, complete */}
            {order?.status === 'draft' && (
              <Button variant='solid' color='secondary' size="sm" onPress={() => handleSubmitSale && handleSubmitSale(order._id)} disabled={submetting}> {submetting ? 'Submitting...' : 'Submit'} </Button>
            )}

            {order?.status === 'submitted' && (
              <Button size="sm" color="primary" onPress={() => ApproveSale && ApproveSale(order._id)} disabled={approving}>{approving ? 'Approving...' : 'Approve'}</Button>
            )}

            {['draft','submitted'].includes(order?.status) && (
              <Button size="sm" color="danger" variant="solid" onPress={() => setRejectOpen(true)} disabled={rejecting}>{rejecting ? 'Rejecting...' : 'Reject'}</Button>
            )}

            {order?.status === 'approved' && (
              <Button size="sm" color="success" onPress={() => CompleteSale && CompleteSale(order._id)} disabled={completing}>{completing ? 'Completing...' : 'Complete'}</Button>
            )}
            <Select selectedKeys={new Set([order?.paymentStatus || 'unpaid'])} size='sm' className='w-24'>
              {["unpaid", "partial", "paid"].map(status => (
                <SelectItem key={status} value={status}
                    onPress={() => HandleUpdatePayment(status, order?._id)}
                >{status}</SelectItem>
              ))}
            </Select>
          </div>
        </div>
      </CardFooter>

      <ConfirmActionModal
        open={rejectOpen}
        title={`Reject ${order?.orderNo}`}
        message={`Are you sure you want to reject this order?`}
        showReason={true}
        onCancel={() => setRejectOpen(false)}
        onConfirm={(reason) => {
          if (RejectSale) RejectSale({ id: order._id, reason })
          setRejectOpen(false)
        }}
      />
    </Card>
  );
};

