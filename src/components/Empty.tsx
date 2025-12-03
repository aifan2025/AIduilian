import { motion } from "framer-motion";

// Empty component
export function Empty() {
  return (
    <div className="flex h-full items-center justify-center">Empty</div>
  );
}

// Empty state component for couplet generator
export function EmptyState() {
  return (
    <motion.div 
      className="h-full flex flex-col items-center justify-center p-6 rounded-xl bg-white/80 dark:bg-gray-800/80 shadow-lg backdrop-blur-sm border border-gray-200 dark:border-gray-700"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-5xl text-red-400 dark:text-red-300 mb-4">
        <i className="fa-solid fa-scroll"></i>
      </div>
      <h3 className="text-xl font-bold mb-2 text-center">还没有生成对联</h3>
      <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
        在上方填写您的姓名和选择场景，点击下方的"生成对联"按钮，我们将为您创作一副精美的对联
      </p>
      <div className="grid grid-cols-3 gap-3 w-full">
        {[
          { text: "结婚祝福", icon: "fa-heart" },
          { text: "春节喜庆", icon: "fa-house-chimney" },
          { text: "开业大吉", icon: "fa-store" }
        ].map((item, index) => (
          <motion.div 
            key={index}
            className="flex flex-col items-center p-3 rounded-lg bg-gray-100 dark:bg-gray-700 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <i className={`fa-solid ${item.icon} text-xl mb-2 text-red-600 dark:text-red-400`}></i>
            <span className="text-sm text-center">{item.text}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}