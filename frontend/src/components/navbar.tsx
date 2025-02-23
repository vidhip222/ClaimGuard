import {
    Shield,
    FileCheck,
    Camera,
    DollarSign,
    AlertTriangle,
} from "lucide-react";

export default function Navbar() {
    return (
        <header className="bg-blue-600 text-white py-4">
            <div className="container mx-auto px-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8" />
                <span className="text-2xl font-bold">ClaimGuard</span>
            </div>
            </div>
        </header>
    );
}
