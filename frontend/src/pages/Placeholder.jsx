const Placeholder = ({ title }) => {
  return (
    <div className="flex flex-col justify-center items-center h-[70vh]">
      <h1 className="text-4xl font-bold mb-4">{title}</h1>
      <p className="text-gray-500">This page is under construction.</p>
    </div>
  );
};
export default Placeholder;
