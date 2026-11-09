import { useState } from "react";
import { Upload } from "lucide-react";

interface ImageUploadInputProps {
    onChange: (file: File | null) => void;
    value?: string;
    placeholder: string
}

export default function ImageUploadInput({ onChange, value, placeholder = 'Upload Image' }: ImageUploadInputProps) {
    const [preview, setPreview] = useState<string | null>(value || null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setPreview(imageUrl);
            onChange(file);
        }
    };

    const handleRemove = () => {
        setPreview(null);
        onChange(null);
    };

    return (
        <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">{placeholder}</label>

            <div
                className={`relative border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-6 cursor-pointer transition hover:border-blue-400 ${preview ? "border-blue-400" : "border-gray-300"
                    }`}
            >
                {preview ? (
                    <>
                        <img src={preview} alt="Preview" className="h-32 w-32 object-cover rounded-lg" />
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="absolute top-2 right-2 bg-white/80 text-red-500 hover:bg-red-50 rounded-full p-1"
                        >
                            ✕
                        </button>
                    </>
                ) : (
                    <>
                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">Click to upload image</p>
                        <p className="text-xs text-gray-400">png, jpg, jpeg (max 10MB)</p>
                    </>
                )}
                <input
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                />
            </div>
        </div>
    );
}
