import { XCircle, Info, CheckCircle2 } from "lucide-react";
import { ToastContainer } from "react-toastify";

export function CustomToastContainer() {
    return (
        <ToastContainer
            position="top-right"
            autoClose={3000}
            newestOnTop={false}
            icon={(context) => {
                if (context.type === "success") return <CheckCircle2 color='white' fill='#0daa2a' className={`${context.theme}`} />
                if (context.type === "error") return <XCircle color='#f73015' fill='white' className={`${context.theme}`} />
                if (context.type === "info") return <Info color='#2b70fe' fill='white' className={`${context.theme}`} />
                return context.type
            }}
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            closeButton={false}
            progressClassName={(context) => {
                return `${context?.defaultClassName} bg-white rounded-full`;
            }}
            toastClassName={(context) => {
                if (context?.type === 'success') return `${context.defaultClassName} bg-[#0daa2a] w-[380px] text-white pl-8`
                if (context?.type === 'info') return `${context.defaultClassName} bg-blue-500 w-[380px] text-white pl-8`
                if (context?.type === 'warning') return `${context.defaultClassName} bg-yellow-500 w-[380px] text-white pl-8`
                if (context?.type === 'error') return `${context.defaultClassName} bg-red-500 w-[380px] text-white pl-8`
                return `bg-red-100`
            }}
        />
    );
}
