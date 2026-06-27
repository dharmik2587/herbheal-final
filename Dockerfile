# Use standard slim Python image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy requirements first to leverage Docker cache
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy all application files
COPY . .

# Set environment variables
ENV FLASK_ENV=production
ENV PORT=7860

# Expose the default Hugging Face Spaces port
EXPOSE 7860

# Start the integrated backend-frontend server
CMD ["python", "backend/app.py"]
