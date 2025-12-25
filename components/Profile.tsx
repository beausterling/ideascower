import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  getProfile,
  updateDisplayName,
  getUserRoastedIdeas,
  toggleRoastedIdeaVisibility,
  deleteRoastedIdea,
} from '../services/supabaseService';
import { Profile as ProfileType, RoastedIdea } from '../types';
import {
  UserIcon,
  EnvelopeIcon,
  ArrowRightOnRectangleIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  GlobeAltIcon,
  LockClosedIcon,
  CheckIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';

const Profile: React.FC = () => {
  const { user, signOut, updateEmail } = useAuth();

  // Profile state
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameSaving, setNameSaving] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);

  // Email change state
  const [newEmail, setNewEmail] = useState('');
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Roasted ideas state
  const [roastedIdeas, setRoastedIdeas] = useState<RoastedIdea[]>([]);
  const [loadingIdeas, setLoadingIdeas] = useState(true);
  const [expandedIdea, setExpandedIdea] = useState<string | null>(null);

  // Sign out state
  const [signingOut, setSigningOut] = useState(false);

  // Load profile and roasted ideas
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      const [profileData, ideasData] = await Promise.all([
        getProfile(user.id),
        getUserRoastedIdeas(user.id),
      ]);

      setProfile(profileData);
      setDisplayName(profileData?.display_name || '');
      setRoastedIdeas(ideasData);
      setLoadingIdeas(false);
    };

    loadData();
  }, [user]);

  const handleSaveName = async () => {
    if (!user) return;

    setNameSaving(true);
    const success = await updateDisplayName(user.id, displayName.trim());
    setNameSaving(false);

    if (success) {
      setNameSuccess(true);
      setIsEditingName(false);
      setTimeout(() => setNameSuccess(false), 2000);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setEmailSaving(true);
    setEmailError('');

    try {
      await updateEmail(newEmail.trim());
      setEmailSuccess(true);
      setNewEmail('');
      setIsChangingEmail(false);
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : 'Failed to update email');
    } finally {
      setEmailSaving(false);
    }
  };

  const handleToggleVisibility = async (ideaId: string, currentStatus: boolean) => {
    const success = await toggleRoastedIdeaVisibility(ideaId, !currentStatus);
    if (success) {
      setRoastedIdeas(ideas =>
        ideas.map(idea =>
          idea.id === ideaId ? { ...idea, is_public: !currentStatus } : idea
        )
      );
    }
  };

  const handleDeleteIdea = async (ideaId: string) => {
    const success = await deleteRoastedIdea(ideaId);
    if (success) {
      setRoastedIdeas(ideas => ideas.filter(idea => idea.id !== ideaId));
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      setSigningOut(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:p-6">
      <div className="relative border border-gray-800 bg-[#080808] overflow-hidden shadow-2xl">
        {/* Ambient Glow */}
        <div className="absolute -top-[150px] -left-[150px] w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none bg-tower-neon/5"></div>
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-tower-accent/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="relative z-10 p-5 sm:p-8 md:p-12">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-3xl sm:text-4xl font-serif text-white mb-3 tracking-tight">Profile</h2>
            <p className="text-gray-400 font-mono text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
              Manage your account and view your roasted ideas.
            </p>
          </div>

          {/* Account Info Section */}
          <div className="mb-8 sm:mb-12">
            <h3 className="text-tower-neon font-bold font-mono uppercase text-xs sm:text-sm mb-4 sm:mb-6 tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-tower-neon rounded-full"></span>
              Account Info
            </h3>

            <div className="space-y-4 sm:space-y-6">
              {/* Email Display */}
              <div className="flex items-center gap-3 sm:gap-4 p-4 bg-black/30 border border-gray-800 rounded-sm">
                <EnvelopeIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-1">Email</div>
                  <div className="text-gray-200 font-mono text-sm truncate">{user?.email}</div>
                </div>
                {!isChangingEmail && (
                  <button
                    onClick={() => setIsChangingEmail(true)}
                    className="text-xs font-mono text-gray-500 hover:text-tower-neon transition-colors uppercase tracking-wider flex-shrink-0"
                  >
                    Change
                  </button>
                )}
              </div>

              {/* Email Change Form */}
              {isChangingEmail && (
                <form onSubmit={handleChangeEmail} className="p-4 bg-black/30 border border-gray-800 rounded-sm">
                  <div className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-2">New Email Address</div>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter new email..."
                    className="w-full bg-black/50 border border-gray-700 rounded-sm px-4 py-2 text-gray-200 font-mono text-sm focus:border-tower-neon focus:outline-none focus:ring-1 focus:ring-tower-neon mb-3"
                  />
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={emailSaving || !newEmail.trim()}
                      className="flex-1 sm:flex-none px-4 py-2 bg-tower-neon text-black font-mono text-sm uppercase tracking-wider hover:bg-tower-neon/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {emailSaving ? 'Sending...' : 'Update'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsChangingEmail(false);
                        setNewEmail('');
                        setEmailError('');
                      }}
                      className="flex-1 sm:flex-none px-4 py-2 border border-gray-700 text-gray-400 font-mono text-sm uppercase tracking-wider hover:text-white hover:border-gray-500 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                  {emailError && (
                    <div className="mt-2 text-tower-accent text-sm font-mono">{emailError}</div>
                  )}
                </form>
              )}

              {/* Email Success Message */}
              {emailSuccess && (
                <div className="p-4 bg-tower-neon/10 border border-tower-neon/30 rounded-sm">
                  <p className="text-tower-neon font-mono text-sm">
                    Verification emails have been sent to both your old and new email addresses. Please check your inbox to confirm the change.
                  </p>
                </div>
              )}

              {/* Display Name */}
              <div className="p-4 bg-black/30 border border-gray-800 rounded-sm">
                <div className="flex items-center gap-4">
                  <UserIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-1">Display Name</div>
                    {!isEditingName && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-200 font-mono truncate">
                          {profile?.display_name || <span className="text-gray-500 italic">Not set</span>}
                        </span>
                        {nameSuccess && <CheckIcon className="w-4 h-4 text-tower-neon flex-shrink-0" />}
                      </div>
                    )}
                  </div>
                  {!isEditingName && (
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="text-gray-500 hover:text-tower-neon transition-colors flex-shrink-0"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {isEditingName && (
                  <div className="mt-3">
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter your name..."
                      className="w-full bg-black/50 border border-gray-700 rounded-sm px-3 py-2 text-gray-200 font-mono text-sm focus:border-tower-neon focus:outline-none focus:ring-1 focus:ring-tower-neon mb-3"
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={handleSaveName}
                        disabled={nameSaving}
                        className="flex-1 sm:flex-none px-4 py-2 bg-tower-neon text-black font-mono text-xs uppercase tracking-wider hover:bg-tower-neon/80 transition-colors disabled:opacity-50"
                      >
                        {nameSaving ? '...' : 'Save'}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingName(false);
                          setDisplayName(profile?.display_name || '');
                        }}
                        className="flex-1 sm:flex-none px-4 py-2 border border-gray-700 text-gray-400 font-mono text-xs uppercase tracking-wider hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Roasted Ideas Section */}
          <div className="mb-8 sm:mb-12">
            <h3 className="text-tower-accent font-bold font-mono uppercase text-xs sm:text-sm mb-4 sm:mb-6 tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-tower-accent rounded-full"></span>
              Your Roasted Ideas ({roastedIdeas.length})
            </h3>

            {loadingIdeas ? (
              <div className="text-center py-8">
                <div className="text-gray-500 font-mono text-sm">Loading...</div>
              </div>
            ) : roastedIdeas.length === 0 ? (
              <div className="text-center py-8 border border-gray-800 bg-black/30 rounded-sm">
                <p className="text-gray-500 font-mono text-sm">
                  No roasted ideas yet. Head to The Incinerator to get your ideas roasted!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {roastedIdeas.map((idea) => (
                  <div
                    key={idea.id}
                    className="border border-gray-800 bg-black/30 rounded-sm overflow-hidden"
                  >
                    {/* Idea Header */}
                    <div
                      className="p-4 cursor-pointer hover:bg-black/50 transition-colors"
                      onClick={() => setExpandedIdea(expandedIdea === idea.id ? null : idea.id)}
                    >
                      {/* Top row: idea text and expand icon */}
                      <div className="flex items-start gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-gray-200 font-mono text-sm line-clamp-2 sm:truncate sm:line-clamp-none">
                            {idea.idea_text}
                          </div>
                        </div>
                        {/* Expand/Collapse */}
                        {expandedIdea === idea.id ? (
                          <ChevronUpIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        ) : (
                          <ChevronDownIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        )}
                      </div>

                      {/* Bottom row: date and action buttons */}
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="text-gray-500 font-mono text-xs flex-1">
                          {formatDate(idea.created_at)}
                        </div>

                        {/* Visibility Toggle */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleVisibility(idea.id, idea.is_public);
                          }}
                          className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-mono uppercase tracking-wider border transition-colors ${
                            idea.is_public
                              ? 'border-tower-neon/50 text-tower-neon hover:bg-tower-neon/10'
                              : 'border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-500'
                          }`}
                          title={idea.is_public ? 'Make private' : 'Make public'}
                        >
                          {idea.is_public ? (
                            <>
                              <GlobeAltIcon className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Public</span>
                            </>
                          ) : (
                            <>
                              <LockClosedIcon className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Private</span>
                            </>
                          )}
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Are you sure you want to delete this roasted idea?')) {
                              handleDeleteIdea(idea.id);
                            }
                          }}
                          className="p-1.5 sm:p-2 text-gray-600 hover:text-tower-accent transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {expandedIdea === idea.id && (
                      <div className="px-4 pb-4 border-t border-gray-800">
                        <div className="pt-4">
                          <div className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-2">Your Idea</div>
                          <p className="text-gray-300 font-mono text-sm mb-4 p-3 bg-black/50 rounded-sm">
                            {idea.idea_text}
                          </p>

                          <div className="text-xs font-mono text-tower-accent uppercase tracking-wider mb-2">The Roast</div>
                          <div className="prose prose-invert prose-sm max-w-none font-light text-gray-300">
                            <ReactMarkdown
                              components={{
                                strong: ({ node, ...props }) => (
                                  <span className="text-tower-accent font-normal" {...props} />
                                ),
                                p: ({ node, ...props }) => (
                                  <p className="mb-3 leading-relaxed" {...props} />
                                ),
                              }}
                            >
                              {idea.roast_result}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sign Out Button */}
          <div className="pt-8 border-t border-gray-800">
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-tower-accent/10 border border-tower-accent/30 text-tower-accent font-mono uppercase tracking-wider hover:bg-tower-accent/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              {signingOut ? 'Signing Out...' : 'Sign Out'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
