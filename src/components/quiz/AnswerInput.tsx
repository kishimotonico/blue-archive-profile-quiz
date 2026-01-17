import { useState, type FormEvent } from 'react';
import Button from '../common/Button';

interface AnswerInputProps {
  onSubmit: (answer: string) => void;
  disabled?: boolean;
}

function AnswerInput({ onSubmit, disabled = false }: AnswerInputProps) {
  const [answer, setAnswer] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (answer.trim()) {
      onSubmit(answer.trim());
      setAnswer('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 justify-center">
      <input
        type="text"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="生徒名を入力"
        disabled={disabled}
        autoComplete="off"
        className="w-48 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-100 text-center"
      />
      <Button type="submit" disabled={disabled || !answer.trim()}>
        回答
      </Button>
    </form>
  );
}

export default AnswerInput;
