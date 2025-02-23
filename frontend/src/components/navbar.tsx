import { Link } from "@tanstack/react-router";
import { Shield } from "lucide-react";

export default function Navbar() {
  return (
    <header className='bg-blue-600 text-white py-4'>
      <div className='flex flex-row justify-center container mx-auto px-4 flex justify-between items-center'>
        <Link className='flex flex-row justify-center items-center space-x-2' to='/'>
          <Shield className='h-8 w-8' />
          <span className='text-2xl font-bold'>ClaimGuard</span>
        </Link>
      </div>
    </header>
  );
}
