'use client'
import React, { useEffect, useState } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { User } from "@heroui/user";
import { Tooltip } from "@heroui/tooltip";
import dayjs from "dayjs";
import { formatDateRelative } from "@/libs/utils";

export const statusColorMap = {
  active: "success",
  paused: "danger",
  vacation: "warning",
};

// Custom action icons
export const EyeIcon = (props) => (
  <svg {...props} viewBox="0 0 20 20" width="1em" height="1em">
    <path d="M12.9833 10C12.9833..." stroke="currentColor" strokeWidth={1.5} />
  </svg>
);

export const EditIcon = (props) => (
  <svg {...props} viewBox="0 0 20 20" width="1em" height="1em">
    <path d="M11.05 3.00002L4.20835..." stroke="currentColor" strokeWidth={1.5} />
  </svg>
);

export const DeleteIcon = (props) => (
  <svg {...props} viewBox="0 0 20 20" width="1em" height="1em">
    <path d="M15.7084 7.61664L15.1667..." stroke="currentColor" strokeWidth={1.5} />
  </svg>
);

const DynamicDataTable = ({
  columns,
  data,
  topContent,
  bottomContent,
  onRowClick,
  renderActions,
  loading,
  isStriped= true,
  ...props
}) => {

  const renderCell = (item, columnKey) => {
    const cellValue = item[columnKey];

    switch (columnKey) {

      case 'user' : return (
        <User  description={item?.userId?.email} name={item?.userId?.name}>
          {item?.userId?.email}
        </User>
      )
      
      case "name":
        return (
          <User avatarProps={{ radius: "lg" }} description={item?.email || item?.description} name={cellValue}>
            {item?.email}
          </User>
        );
        

      case "activerole":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-sm capitalize">{item?.userId?.activerole}</p>
            <p className="text-bold text-sm text-default-400 dark:text-gray-300">{item?.team}</p>
          </div>
        );

      case "status":
        return (
          <Chip color={item?.revoked ? 'success' : 'danger'} size="sm" variant="flat">
            {cellValue}
          </Chip>
        );
      
      case 'createdBy' : return (
        <User description={item?.createdBy?.email} name={item?.createdBy?.name}>
          {item?.createdBy?.email}
        </User>
      )
      
        case 'lastUsedAt':
          return (
            <Tooltip content={formatDateRelative(cellValue)}>
              <p>{dayjs(cellValue).format("DD MMM YYYY")}</p>
            </Tooltip>
          );

      case "actions":
        // Hide action buttons when the item is revoked. Support both boolean and label styles.
        const revokedFlag = item?.isRevoked ?? (item?.revoked === 'Revoked')
        return renderActions && !revokedFlag ?  (
          <div className="flex justify-end">
            {renderActions(item)}
          </div>
        )
        : null

      default:
        return cellValue;
    }
  }

  return (

      <Table isStriped={isStriped} aria-label="Dynamic table with custom cells" isLoading={loading} topContent={topContent} bottomContent={bottomContent}
        classNames={{
          th: "bg-primary text-white",
        }}
        {...props}
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn key={column.uid} align={column.uid === "actions" ? "end" : "start"}>
              {column.name}
            </TableColumn>
          )}
        </TableHeader>

        <TableBody isLoading={loading} items={data} 
          emptyContent={
            <div className="flex flex-col items-center gap-2">
              <p>No data found.</p>
            </div>
          }
          loadingContent={
          <div className="flex flex-col items-center gap-2 relative">
            <Spinner size="lg" color="primary" />
            <p>Loading...</p>
          </div>
        } >
          {(item) => (
            <TableRow key={item?._id} onClick={() => onRowClick?.(item)}>
              {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
            </TableRow>
          )}
        </TableBody>
      </Table>
  );
};

export default DynamicDataTable;