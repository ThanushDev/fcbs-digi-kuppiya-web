import { useAuth } from '../../contexts/AuthContext'
import GPACalculator from './GPACalculator'
import LCSGPACalculator from './LCSGPACalculator'

export default function GPACalculatorWrapper() {
  const { userData } = useAuth()
  
  const userDept = (userData?.department || '').toLowerCase()
  
  if (userDept === 'lcs') {
    return <LCSGPACalculator />
  }
  
  return <GPACalculator />
}