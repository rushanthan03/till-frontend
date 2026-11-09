import { TablePagination } from "@mui/material"
import { FC } from "react"

interface PaginationProps {
    page: string;
    limit: string;
    total: number;
    handleChangePage: (event: unknown, newPage: number) => void;
    handleChangeRowsPerPage: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const Pagination: FC<PaginationProps> = ({ page, limit, total, handleChangePage, handleChangeRowsPerPage }) => {
    return (
        <div className="bg-linear-to-r from-slate-50 via-gray-50 to-slate-50 border-t-2 border-gray-200 px-6 py-3 rounded-b-xl">
            <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 font-medium">
                    Showing <span className="font-bold text-gray-900">{total === 0 ? 0 : ((Number(page) - 1) * Number(limit)) + 1}</span> to{' '}
                    <span className="font-bold text-gray-900">{Math.min(Number(page) * Number(limit), total)}</span> of{' '}
                    <span className="font-bold text-gray-900">{total}</span> results
                </div>
                <TablePagination
                    component="div"
                    count={total}
                    page={Number(page) - 1}
                    onPageChange={handleChangePage}
                    rowsPerPage={Number(limit)}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="Rows per page:"
                    sx={{
                        '& .MuiTablePagination-toolbar': {
                            minHeight: '52px',
                            paddingLeft: 0,
                            paddingRight: 0,
                        },
                        '& .MuiTablePagination-selectLabel': {
                            fontSize: '0.875rem',
                            color: '#6b7280',
                            fontWeight: 500,
                            margin: 0,
                        },
                        '& .MuiTablePagination-displayedRows': {
                            fontSize: '0.875rem',
                            color: '#6b7280',
                            fontWeight: 500,
                            margin: 0,
                        },
                        '& .MuiTablePagination-select': {
                            borderRadius: '0.5rem',
                            border: '2px solid #e5e7eb',
                            padding: '0.375rem 2.5rem 0.375rem 0.75rem',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            backgroundColor: 'white',
                            transition: 'all 0.2s',
                            '&:hover': {
                                backgroundColor: '#f9fafb',
                                borderColor: '#d1d5db',
                            },
                            '&:focus': {
                                borderColor: '#3b82f6',
                                backgroundColor: 'white',
                            },
                        },
                        '& .MuiTablePagination-actions': {
                            marginLeft: '1rem',
                        },
                        '& .MuiTablePagination-actions button': {
                            borderRadius: '0.5rem',
                            padding: '0.5rem',
                            border: '2px solid transparent',
                            transition: 'all 0.2s',
                            '&:hover:not(.Mui-disabled)': {
                                backgroundColor: '#f3f4f6',
                                borderColor: '#e5e7eb',
                            },
                            '&.Mui-disabled': {
                                opacity: 0.3,
                            },
                        },
                    }}
                />
            </div>
        </div>
    )
}

export default Pagination
