function Input({ label, id, ...resto }) {
  return (
    <>
      <label htmlFor={id} className="auth__label">{label}</label>
      <input id={id} className="auth__input" {...resto} />
    </>
  );
}

export default Input;